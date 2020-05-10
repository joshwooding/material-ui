import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import TreeItemIcon from './TreeItemIcon';
import Typography from '@material-ui/core/Typography';
import { fade, withStyles } from '@material-ui/core/styles';

const styles = (theme) => ({
  root: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&$focused': {
      backgroundColor: theme.palette.action.hover,
    },
    '&$selected': {
      backgroundColor: fade(theme.palette.primary.main, theme.palette.action.selectedOpacity),
    },
    '&$selected:hover, &$selected$focused': {
      backgroundColor: fade(
        theme.palette.primary.main,
        theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity,
      ),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
  },
  /* Pseudo-class applied to the content element when expanded. */
  expanded: {},
  /* Pseudo-class applied to the content element when selected. */
  selected: {},
  /* Pseudo-class applied to the content element when focused. */
  focused: {},
  /* Styles applied to the label element. */
  label: {
    width: '100%',
    paddingLeft: 4,
    position: 'relative',
  },
  iconContainer: {},
});

const TreeItemContent = React.forwardRef(function TreeItemContent(props, ref) {
  const {
    classes,
    className,
    label,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    onClick,
    onMouseDown,
    expansionIcon,
    displayIcon,
    icon: iconProp,
    ...rest
  } = props;

  const handleClick = (event) => {
    handleSelection(event);
    handleExpansion(event);

    if (onClick) {
      onClick(event);
    }
  };

  const icon = iconProp || expansionIcon || displayIcon;

  return (
    // Key events handled on li
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <div
      className={clsx(
        classes.root,
        {
          [classes.expanded]: expanded,
          [classes.selected]: selected,
          [classes.focused]: focused,
        },
        className,
      )}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      ref={ref}
      {...rest}
    >
      <TreeItemIcon className={classes.iconContainer} icon={icon} />
      <Typography component="div" className={classes.label}>
        {label}
      </Typography>
    </div>
  );
});

TreeItemContent.propTypes = {
  classes: PropTypes.object,
  className: PropTypes.string,
  displayIcon: PropTypes.node,
  expanded: PropTypes.bool,
  expansionIcon: PropTypes.node,
  focused: PropTypes.bool,
  handleExpansion: PropTypes.func,
  handleSelection: PropTypes.func,
  icon: PropTypes.node,
  label: PropTypes.node,
  onClick: PropTypes.func,
  onMouseDown: PropTypes.func,
  selected: PropTypes.bool,
};

export default withStyles(styles, { name: 'MuiTreeItemContent' })(TreeItemContent);
