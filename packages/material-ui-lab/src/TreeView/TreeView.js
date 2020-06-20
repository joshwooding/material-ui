import * as React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { useControlled } from '@material-ui/core/utils';
import { useDescendants, DescendantProvider } from './descendants';
import TreeViewContext from './TreeViewContext';

export const styles = {
  /* Styles applied to the root element. */
  root: {
    padding: 0,
    margin: 0,
    listStyle: 'none',
  },
};

const findNextFirstChar = (firstChars, startIndex, char) => {
  for (let i = startIndex; i < firstChars.length; i += 1) {
    if (char === firstChars[i]) {
      return i;
    }
  }
  return -1;
};

const defaultExpandedDefault = [];
const defaultSelectedDefault = [];

const getChildren = (id, map) =>
  Object.keys(map)
    .map((k) => map[k])
    .filter((n) => n.parent === id)
    .sort((a, b) => a.index - b.index)
    .map((c) => c.id);

const TreeView = React.forwardRef(function TreeView(props, ref) {
  const {
    children,
    classes,
    className,
    defaultCollapseIcon,
    defaultEndIcon,
    defaultExpanded = defaultExpandedDefault,
    defaultExpandIcon,
    defaultParentIcon,
    defaultSelected = defaultSelectedDefault,
    disableSelection = false,
    multiSelect = false,
    expanded: expandedProp,
    onNodeSelect,
    onNodeToggle,
    selected: selectedProp,
    ...other
  } = props;
  const [tabbable, setTabbable] = React.useState(null);
  const [focusedNodeId, setFocusedNodeId] = React.useState(null);

  const nodeMap = React.useRef({});

  const firstCharMap = React.useRef({});
  const visibleNodes = React.useRef([]);

  const [expanded, setExpandedState] = useControlled({
    controlled: expandedProp,
    default: defaultExpanded,
    name: 'TreeView',
    state: 'expanded',
  });

  const [selected, setSelectedState] = useControlled({
    controlled: selectedProp,
    default: defaultSelected,
    name: 'TreeView',
    state: 'selected',
  });

  /*
   * Status Helpers
   */
  const isExpanded = React.useCallback(
    (id) => (Array.isArray(expanded) ? expanded.indexOf(id) !== -1 : false),
    [expanded],
  );

  const isSelected = React.useCallback(
    (id) => (Array.isArray(selected) ? selected.indexOf(id) !== -1 : selected === id),
    [selected],
  );

  const isTabbable = (id) => tabbable === id;
  const isFocused = (id) => focusedNodeId === id;

  /*
   * Node Helpers
   */

  const getNextNode = (id) => {
    const nodeIndex = visibleNodes.current.indexOf(id);
    if (nodeIndex !== -1 && nodeIndex + 1 < visibleNodes.current.length) {
      return visibleNodes.current[nodeIndex + 1];
    }
    return null;
  };

  const getPreviousNode = (id) => {
    const nodeIndex = visibleNodes.current.indexOf(id);
    if (nodeIndex !== -1 && nodeIndex - 1 >= 0) {
      return visibleNodes.current[nodeIndex - 1];
    }
    return null;
  };

  const getLastNode = () => visibleNodes.current[visibleNodes.current.length - 1];
  const getFirstNode = () => visibleNodes.current[0];

  const getNodesInRange = (a, b) => {
    const aIndex = visibleNodes.current.indexOf(a);
    const bIndex = visibleNodes.current.indexOf(b);
    const start = Math.min(aIndex, bIndex);
    const end = Math.max(aIndex, bIndex);
    return visibleNodes.current.slice(start, end + 1);
  };

  /*
   * Focus Helpers
   */

  const focus = (id) => {
    if (id) {
      setTabbable(id);
      setFocusedNodeId(id);
    }
  };

  const focusNextNode = (id) => focus(getNextNode(id));
  const focusPreviousNode = (id) => focus(getPreviousNode(id));
  const focusFirstNode = () => focus(getFirstNode());
  const focusLastNode = () => focus(getLastNode());

  const focusByFirstCharacter = (id, char) => {
    let start;
    let index;
    const lowercaseChar = char.toLowerCase();

    const firstCharIds = [];
    const firstChars = [];
    // This really only works since the ids are strings
    Object.keys(firstCharMap.current).forEach((nodeId) => {
      const firstChar = firstCharMap.current[nodeId];
      const map = nodeMap.current[nodeId];
      const visible = map.parent ? isExpanded(map.parent) : true;

      if (visible) {
        firstCharIds.push(nodeId);
        firstChars.push(firstChar);
      }
    });

    // Get start index for search based on position of currentItem
    start = firstCharIds.indexOf(id) + 1;
    if (start === nodeMap.current.length) {
      start = 0;
    }

    // Check remaining slots in the menu
    index = findNextFirstChar(firstChars, start, lowercaseChar);

    // If not found in remaining slots, check from beginning
    if (index === -1) {
      index = findNextFirstChar(firstChars, 0, lowercaseChar);
    }

    // If match was found...
    if (index > -1) {
      focus(firstCharIds[index]);
    }
  };

  /*
   * Expansion Helpers
   */

  const toggleExpansion = (event, value = focusedNodeId) => {
    let newExpanded;
    if (expanded.indexOf(value) !== -1) {
      newExpanded = expanded.filter((id) => id !== value);
      setTabbable((oldTabbable) => {
        const map = nodeMap.current[oldTabbable];
        const parentMap = map ? nodeMap.current[map.parent] : {};
        // If parent node was collapsed move tabbable to parent
        if (oldTabbable && parentMap && parentMap.id === value) {
          return value;
        }
        return oldTabbable;
      });
    } else {
      newExpanded = [value].concat(expanded);
    }

    if (onNodeToggle) {
      onNodeToggle(event, newExpanded);
    }

    setExpandedState(newExpanded);
  };

  const expandAllSiblings = (event, id) => {
    const map = nodeMap.current[id];
    const siblings = getChildren(map.parent, nodeMap.current);

    let diff;
    if (siblings) {
      diff = siblings.filter((child) => !isExpanded(child));
    } else {
      const topLevelNodes = getChildren(null, map);
      diff = topLevelNodes.filter((node) => !isExpanded(node));
    }

    if (diff.length > 0) {
      const newExpanded = expanded.concat(diff);
      setExpandedState(newExpanded);

      if (onNodeToggle) {
        onNodeToggle(event, newExpanded);
      }
    }
  };

  /*
   * Selection Helpers
   */

  const lastSelectedNode = React.useRef(null);
  const lastSelectionWasRange = React.useRef(false);
  const currentRangeSelection = React.useRef([]);

  const handleRangeArrowSelect = (event, nodes) => {
    let base = selected;
    const { start, next, current } = nodes;

    if (!next || !current) {
      return;
    }

    if (currentRangeSelection.current.indexOf(current) === -1) {
      currentRangeSelection.current = [];
    }

    if (lastSelectionWasRange.current) {
      if (currentRangeSelection.current.indexOf(next) !== -1) {
        base = base.filter((id) => id === start || id !== current);
        currentRangeSelection.current = currentRangeSelection.current.filter(
          (id) => id === start || id !== current,
        );
      } else {
        base.push(next);
        currentRangeSelection.current.push(next);
      }
    } else {
      base.push(next);
      currentRangeSelection.current.push(current, next);
    }

    if (onNodeSelect) {
      onNodeSelect(event, base);
    }

    setSelectedState(base);
  };

  const handleRangeSelect = (event, nodes) => {
    let base = selected;
    const { start, end } = nodes;
    // If last selection was a range selection ignore nodes that were selected.
    if (lastSelectionWasRange.current) {
      base = selected.filter((id) => currentRangeSelection.current.indexOf(id) === -1);
    }

    const range = getNodesInRange(start, end);
    currentRangeSelection.current = range;
    let newSelected = base.concat(range);
    newSelected = newSelected.filter((id, i) => newSelected.indexOf(id) === i);

    if (onNodeSelect) {
      onNodeSelect(event, newSelected);
    }

    setSelectedState(newSelected);
  };

  const handleMultipleSelect = (event, value) => {
    let newSelected = [];
    if (selected.indexOf(value) !== -1) {
      newSelected = selected.filter((id) => id !== value);
    } else {
      newSelected = [value].concat(selected);
    }

    if (onNodeSelect) {
      onNodeSelect(event, newSelected);
    }

    setSelectedState(newSelected);
  };

  const handleSingleSelect = (event, value) => {
    const newSelected = multiSelect ? [value] : value;

    if (onNodeSelect) {
      onNodeSelect(event, newSelected);
    }

    setSelectedState(newSelected);
  };

  const selectNode = (event, id, multiple = false) => {
    if (id) {
      if (multiple) {
        handleMultipleSelect(event, id);
      } else {
        handleSingleSelect(event, id);
      }
      lastSelectedNode.current = id;
      lastSelectionWasRange.current = false;
      currentRangeSelection.current = [];

      return true;
    }
    return false;
  };

  const selectRange = (event, nodes, stacked = false) => {
    const { start = lastSelectedNode.current, end, current } = nodes;
    if (stacked) {
      handleRangeArrowSelect(event, { start, next: end, current });
    } else {
      handleRangeSelect(event, { start, end });
    }
    lastSelectionWasRange.current = true;
    return true;
  };

  const rangeSelectToFirst = (event, id) => {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = id;
    }

    const start = lastSelectionWasRange.current ? lastSelectedNode.current : id;

    return selectRange(event, {
      start,
      end: getFirstNode(),
    });
  };

  const rangeSelectToLast = (event, id) => {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = id;
    }

    const start = lastSelectionWasRange.current ? lastSelectedNode.current : id;

    return selectRange(event, {
      start,
      end: getLastNode(),
    });
  };

  const selectNextNode = (event, id) =>
    selectRange(
      event,
      {
        end: getNextNode(id),
        current: id,
      },
      true,
    );

  const selectPreviousNode = (event, id) =>
    selectRange(
      event,
      {
        end: getPreviousNode(id),
        current: id,
      },
      true,
    );

  const selectAllNodes = (event) =>
    selectRange(event, { start: getFirstNode(), end: getLastNode() });

  /*
   * Mapping Helpers
   */

  const registerNode = React.useCallback((node) => {
    const { id, parent, label, index } = node;

    if (id) {
      nodeMap.current[id] = { id, parent, label, index };
    }
  }, []);

  const getNodesToRemove = React.useCallback((id) => {
    const map = nodeMap.current[id];
    const nodes = [];
    if (map) {
      nodes.push(id);
      const childNodes = getChildren(id, nodeMap.current);
      if (childNodes.length > 0) {
        nodes.push(...childNodes);
        childNodes.forEach((node) => {
          nodes.push(...getNodesToRemove(node));
        });
      }
    }
    return nodes;
  }, []);

  const cleanUpFirstCharMap = React.useCallback((nodes) => {
    const newMap = { ...firstCharMap.current };
    nodes.forEach((node) => {
      if (newMap[node]) {
        delete newMap[node];
      }
    });
    firstCharMap.current = newMap;
  }, []);

  const unregisterNode = React.useCallback(
    (id) => {
      const nodes = getNodesToRemove(id);
      cleanUpFirstCharMap(nodes);
      const newMap = { ...nodeMap.current };

      nodes.forEach((node) => {
        delete newMap[node];
      });
      nodeMap.current = newMap;

      setFocusedNodeId((oldFocusedNodeId) => {
        if (oldFocusedNodeId === id) {
          return null;
        }
        return oldFocusedNodeId;
      });
    },
    [getNodesToRemove, cleanUpFirstCharMap],
  );

  const mapFirstChar = (id, firstChar) => {
    firstCharMap.current[id] = firstChar;
  };

  React.useEffect(() => {
    const buildVisible = (nodes) => {
      let list = [];
      for (let i = 0; i < nodes.length; i += 1) {
        const item = nodes[i];
        list.push(item);
        const childs = getChildren(item, nodeMap.current);
        if (isExpanded(item) && childs) {
          list = list.concat(buildVisible(childs));
        }
      }
      return list;
    };

    visibleNodes.current = buildVisible(getChildren(null, nodeMap.current));
  }, [isExpanded]);

  const itemsRef = useDescendants();
  const topLevelNodes = getChildren(null, nodeMap.current);

  React.useEffect(() => {
    setTabbable((old) => {
      if (!old) {
        return topLevelNodes[0];
      }
      return old;
    });
  }, [topLevelNodes]);

  const noopSelection = () => {
    return false;
  };

  return (
    <TreeViewContext.Provider
      value={{
        icons: { defaultCollapseIcon, defaultExpandIcon, defaultParentIcon, defaultEndIcon },
        focus,
        focusFirstNode,
        focusLastNode,
        focusNextNode,
        focusPreviousNode,
        focusByFirstCharacter,
        expandAllSiblings,
        toggleExpansion,
        isExpanded,
        isFocused,
        isSelected,
        selectNode: disableSelection ? noopSelection : selectNode,
        selectRange: disableSelection ? noopSelection : selectRange,
        selectNextNode: disableSelection ? noopSelection : selectNextNode,
        selectPreviousNode: disableSelection ? noopSelection : selectPreviousNode,
        rangeSelectToFirst: disableSelection ? noopSelection : rangeSelectToFirst,
        rangeSelectToLast: disableSelection ? noopSelection : rangeSelectToLast,
        selectAllNodes: disableSelection ? noopSelection : selectAllNodes,
        isTabbable,
        multiSelect,
        mapFirstChar,
        registerNode,
        unregisterNode,
      }}
    >
      <DescendantProvider items={itemsRef} nodeId={null}>
        <ul
          role="tree"
          aria-multiselectable={multiSelect}
          className={clsx(classes.root, className)}
          ref={ref}
          {...other}
        >
          {children}
        </ul>
      </DescendantProvider>
    </TreeViewContext.Provider>
  );
});

TreeView.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // |     To update them edit the d.ts file and run "yarn proptypes"     |
  // ----------------------------------------------------------------------
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css) below for more details.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The default icon used to collapse the node.
   */
  defaultCollapseIcon: PropTypes.node,
  /**
   * The default icon displayed next to a end node. This is applied to all
   * tree nodes and can be overridden by the TreeItem `icon` prop.
   */
  defaultEndIcon: PropTypes.node,
  /**
   * Expanded node ids. (Uncontrolled)
   */
  defaultExpanded: PropTypes.arrayOf(PropTypes.string),
  /**
   * The default icon used to expand the node.
   */
  defaultExpandIcon: PropTypes.node,
  /**
   * The default icon displayed next to a parent node. This is applied to all
   * parent nodes and can be overridden by the TreeItem `icon` prop.
   */
  defaultParentIcon: PropTypes.node,
  /**
   * Selected node ids. (Uncontrolled)
   * When `multiSelect` is true this takes an array of strings; when false (default) a string.
   */
  defaultSelected: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
  /**
   * If `true` selection is disabled.
   */
  disableSelection: PropTypes.bool,
  /**
   * Expanded node ids. (Controlled)
   */
  expanded: PropTypes.arrayOf(PropTypes.string),
  /**
   * If true `ctrl` and `shift` will trigger multiselect.
   */
  multiSelect: PropTypes.bool,
  /**
   * Callback fired when tree items are selected/unselected.
   *
   * @param {object} event The event source of the callback
   * @param {(array|string)} value of the selected nodes. When `multiSelect` is true
   * this is an array of strings; when false (default) a string.
   */
  onNodeSelect: PropTypes.func,
  /**
   * Callback fired when tree items are expanded/collapsed.
   *
   * @param {object} event The event source of the callback.
   * @param {array} nodeIds The ids of the expanded nodes.
   */
  onNodeToggle: PropTypes.func,
  /**
   * Selected node ids. (Controlled)
   * When `multiSelect` is true this takes an array of strings; when false (default) a string.
   */
  selected: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
};

export default withStyles(styles, { name: 'MuiTreeView' })(TreeView);
