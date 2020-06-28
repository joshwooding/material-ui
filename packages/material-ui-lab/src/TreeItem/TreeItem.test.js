import * as React from 'react';
import { expect } from 'chai';
import { spy } from 'sinon';
import { getClasses } from '@material-ui/core/test-utils';
import createMount from 'test/utils/createMount';
import describeConformance from '@material-ui/core/test-utils/describeConformance';
import {
  act,
  createEvent,
  createClientRender,
  fireEvent,
  screen,
} from 'test/utils/createClientRender';
import TreeItem from './TreeItem';
import TreeView from '../TreeView';

describe('<TreeItem />', () => {
  let classes;
  // StrictModeViolation: uses Collapse
  const mount = createMount({ strict: false });
  const render = createClientRender({ strict: false });

  before(() => {
    classes = getClasses(<TreeItem nodeId="one" label="one" />);
  });

  describeConformance(<TreeItem nodeId="one" label="one" />, () => ({
    classes,
    inheritComponent: 'li',
    mount,
    refInstanceof: window.HTMLLIElement,
    skip: ['componentProp'],
  }));

  it('should call onClick when clicked', () => {
    const handleClick = spy();

    render(
      <TreeView>
        <TreeItem nodeId="test" label="test" onClick={handleClick} />
      </TreeView>,
    );

    fireEvent.click(screen.getByText('test'));

    expect(handleClick.callCount).to.equal(1);
  });

  it('should display the right icons', () => {
    const defaultEndIcon = <div data-test="defaultEndIcon" />;
    const defaultExpandIcon = <div data-test="defaultExpandIcon" />;
    const defaultCollapseIcon = <div data-test="defaultCollapseIcon" />;
    const defaultParentIcon = <div data-test="defaultParentIcon" />;
    const icon = <div data-test="icon" />;
    const endIcon = <div data-test="endIcon" />;

    render(
      <TreeView
        defaultEndIcon={defaultEndIcon}
        defaultExpandIcon={defaultExpandIcon}
        defaultCollapseIcon={defaultCollapseIcon}
        defaultParentIcon={defaultParentIcon}
        defaultExpanded={['1']}
      >
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2" />
          <TreeItem nodeId="5" label="5" data-testid="5" icon={icon} />
          <TreeItem nodeId="6" label="6" data-testid="6" endIcon={endIcon} />
        </TreeItem>
        <TreeItem nodeId="3" label="3" data-testid="3">
          <TreeItem nodeId="4" label="4" data-testid="4" />
        </TreeItem>
      </TreeView>,
    );

    const getIcon = (testId) =>
      screen.getByTestId(testId).querySelector(`.${classes.iconContainer} div`);

    expect(getIcon('1')).attribute('data-test').to.equal('defaultCollapseIcon');
    expect(getIcon('2')).attribute('data-test').to.equal('defaultEndIcon');
    expect(getIcon('3')).attribute('data-test').to.equal('defaultExpandIcon');
    expect(getIcon('5')).attribute('data-test').to.equal('icon');
    expect(getIcon('6')).attribute('data-test').to.equal('endIcon');
  });

  it('should allow conditional child', () => {
    function TestComponent() {
      const [hide, setState] = React.useState(false);

      return (
        <React.Fragment>
          <button data-testid="button" type="button" onClick={() => setState(true)}>
            Hide
          </button>
          <TreeView defaultExpanded={['1']}>
            <TreeItem nodeId="1" data-testid="1">
              {!hide && <TreeItem nodeId="2" data-testid="2" />}
            </TreeItem>
          </TreeView>
        </React.Fragment>
      );
    }
    render(<TestComponent />);

    expect(screen.getByTestId('1')).to.have.attribute('aria-expanded', 'true');
    expect(screen.getByTestId('2')).not.to.equal(null);
    fireEvent.click(screen.getByText('Hide'));
    expect(screen.getByTestId('1')).to.not.have.attribute('aria-expanded');
    expect(screen.queryByTestId('2')).to.equal(null);
  });

  it('should treat an empty array equally to no children', () => {
    render(
      <TreeView defaultExpanded={['1']}>
        <TreeItem nodeId="1" label="1" data-testid="1">
          <TreeItem nodeId="2" label="2" data-testid="2">
            {[]}
          </TreeItem>
        </TreeItem>
      </TreeView>,
    );

    expect(screen.getByTestId('2')).to.not.have.attribute('aria-expanded');
  });

  it('should not call onClick when children are clicked', () => {
    const handleClick = spy();

    render(
      <TreeView defaultExpanded={['one']}>
        <TreeItem nodeId="one" label="one" onClick={handleClick}>
          <TreeItem nodeId="two" label="two" />
        </TreeItem>
      </TreeView>,
    );

    fireEvent.click(screen.getByText('two'));

    expect(handleClick.callCount).to.equal(0);
  });

  describe('Accessibility', () => {
    it('should have the role `treeitem`', () => {
      render(
        <TreeView>
          <TreeItem nodeId="test" label="test" data-testid="test" />
        </TreeView>,
      );

      expect(screen.getByTestId('test')).to.have.attribute('role', 'treeitem');
    });

    it('should add the role `group` to a component containing children', () => {
      render(
        <TreeView defaultExpanded={['test']}>
          <TreeItem nodeId="test" label="test">
            <TreeItem nodeId="test2" label="test2" />
          </TreeItem>
        </TreeView>,
      );

      expect(screen.getByRole('group')).to.contain(screen.getByText('test2'));
    });

    describe('aria-expanded', () => {
      it('should have the attribute `aria-expanded=false` if collapsed', () => {
        render(
          <TreeView>
            <TreeItem nodeId="test" label="test" data-testid="test">
              <TreeItem nodeId="test2" label="test2" />
            </TreeItem>
          </TreeView>,
        );

        expect(screen.getByTestId('test')).to.have.attribute('aria-expanded', 'false');
      });

      it('should have the attribute `aria-expanded=true` if expanded', () => {
        render(
          <TreeView defaultExpanded={['test']}>
            <TreeItem nodeId="test" label="test" data-testid="test">
              <TreeItem nodeId="test2" label="test2" />
            </TreeItem>
          </TreeView>,
        );

        expect(screen.getByTestId('test')).to.have.attribute('aria-expanded', 'true');
      });

      it('should not have the attribute `aria-expanded` if no children are present', () => {
        render(
          <TreeView>
            <TreeItem nodeId="test" label="test" data-testid="test" />
          </TreeView>,
        );

        expect(screen.getByTestId('test')).to.not.have.attribute('aria-expanded');
      });
    });

    describe('aria-selected', () => {
      describe('single-select', () => {
        it('should not have the attribute `aria-selected` if not selected', () => {
          render(
            <TreeView>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </TreeView>,
          );

          expect(screen.getByTestId('test')).to.not.have.attribute('aria-selected');
        });

        it('should have the attribute `aria-selected=true` if selected', () => {
          render(
            <TreeView defaultSelected={'test'}>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </TreeView>,
          );

          expect(screen.getByTestId('test')).to.have.attribute('aria-selected', 'true');
        });
      });

      describe('multi-select', () => {
        it('should have the attribute `aria-selected=false` if not selected', () => {
          render(
            <TreeView multiSelect>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </TreeView>,
          );

          expect(screen.getByTestId('test')).to.have.attribute('aria-selected', 'false');
        });
        it('should have the attribute `aria-selected=true` if selected', () => {
          render(
            <TreeView multiSelect defaultSelected={'test'}>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </TreeView>,
          );

          expect(screen.getByTestId('test')).to.have.attribute('aria-selected', 'true');
        });

        it('should have the attribute `aria-selected` if disableSelection is true', () => {
          render(
            <TreeView multiSelect disableSelection>
              <TreeItem nodeId="test" label="test" data-testid="test" />
            </TreeView>,
          );

          expect(screen.getByTestId('test')).to.have.attribute('aria-selected', 'false');
        });
      });
    });

    describe('when a tree receives focus', () => {
      it('should focus the first node if none of the nodes are selected before the tree receives focus', () => {
        render(
          <TreeView id="tree">
            <TreeItem nodeId="1" label="one" data-testid="one" />
            <TreeItem nodeId="2" label="two" />
            <TreeItem nodeId="3" label="three" />
          </TreeView>,
        );

        expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        screen.getByRole('tree').focus();
        expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-1');
      });

      it('should focus the selected node if a node is selected before the tree receives focus', () => {
        render(
          <TreeView selected="2" id="tree">
            <TreeItem nodeId="1" label="one" data-testid="one" />
            <TreeItem nodeId="2" label="two" data-testid="two" />
            <TreeItem nodeId="3" label="three" />
          </TreeView>,
        );

        expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
        screen.getByRole('tree').focus();
        expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-2');
      });
    });

    describe('Navigation', () => {
      describe('right arrow interaction', () => {
        it('should open the node and not move the focus if focus is on a closed node', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" />
              </TreeItem>
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'false');

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowRight' });

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });

        it('should move focus to the first child if focus is on an open node', () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowRight' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });

        it('should do nothing if focus is on an end node', () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );

          fireEvent.click(screen.getByText('two'));

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowRight' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });
      });

      describe('left arrow interaction', () => {
        it('should close the node if focus is on an open node', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" id="tree">
                <TreeItem nodeId="two" label="two" />
              </TreeItem>
            </TreeView>,
          );
          const [firstItem] = screen.getAllByRole('treeitem');
          const firstItemLabel = screen.getByText('one');

          fireEvent.click(firstItemLabel);

          expect(firstItem).to.have.attribute('aria-expanded', 'true');

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(firstItem).to.have.attribute('aria-expanded', 'false');
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });

        it("should move focus to the node's parent node if focus is on a child node that is an end node", () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );
          const [firstItem] = screen.getAllByRole('treeitem');
          const secondItemLabel = screen.getByText('two');

          expect(firstItem).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(secondItemLabel);
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
          expect(firstItem).to.have.attribute('aria-expanded', 'true');
        });

        it("should move focus to the node's parent node if focus is on a child node that is closed", () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two">
                  <TreeItem nodeId="three" label="three" />
                </TreeItem>
              </TreeItem>
            </TreeView>,
          );

          fireEvent.click(screen.getByText('one'));

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          // move focus to node two
          fireEvent.click(screen.getByText('two'));
          fireEvent.click(screen.getByText('two'));

          screen.getByRole('tree').focus();

          expect(screen.getByTestId('two')).to.have.attribute('aria-expanded', 'false');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');
        });

        it('should do nothing if focus is on a root node that is closed', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" />
              </TreeItem>
            </TreeView>,
          );

          screen.getByRole('tree').focus();
          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'false');
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });

        it('should do nothing if focus is on a root node that is an end node', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowLeft' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });
      });

      describe('down arrow interaction', () => {
        it('moves focus to a sibling node', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });

        it('moves focus to a child node', () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });

        it('moves focus to a child node works with a dynamic tree', () => {
          function TestComponent() {
            const [hide, setState] = React.useState(false);

            return (
              <React.Fragment>
                <button
                  data-testid="button"
                  type="button"
                  onClick={() => setState((value) => !value)}
                >
                  Toggle Hide
                </button>
                <TreeView defaultExpanded={['one']} id="tree">
                  {!hide && (
                    <TreeItem nodeId="one" label="one" data-testid="one">
                      <TreeItem nodeId="two" label="two" data-testid="two" />
                    </TreeItem>
                  )}
                  <TreeItem nodeId="three" label="three" />
                </TreeView>
              </React.Fragment>
            );
          }

          render(<TestComponent />);

          expect(screen.getByTestId('one')).not.to.equal(null);
          fireEvent.click(screen.getByText('Toggle Hide'));
          expect(screen.queryByTestId('one')).to.equal(null);
          fireEvent.click(screen.getByText('Toggle Hide'));
          expect(screen.getByTestId('one')).not.to.equal(null);

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });

        it("moves focus to a parent's sibling", () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
              <TreeItem nodeId="three" label="three" data-testid="three" />
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(screen.getByText('two'));
          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-three');
        });
      });

      describe('up arrow interaction', () => {
        it('moves focus to a sibling node', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('two'));
          screen.getByRole('tree').focus();
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });

        it('moves focus to a parent', () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(screen.getByText('two'));
          screen.getByRole('tree').focus();
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });

        it("moves focus to a sibling's child", () => {
          render(
            <TreeView defaultExpanded={['one']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
              <TreeItem nodeId="three" label="three" data-testid="three" />
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.click(screen.getByText('three'));
          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-three');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });
      });

      describe('home key interaction', () => {
        it('moves focus to the first node in the tree', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('four'));
          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-four');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'Home' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });
      });

      describe('end key interaction', () => {
        it('moves focus to the last node in the tree without expanded items', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'End' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-four');
        });

        it('moves focus to the last node in the tree with expanded items', () => {
          render(
            <TreeView defaultExpanded={['four', 'five']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four">
                <TreeItem nodeId="five" label="five" data-testid="five">
                  <TreeItem nodeId="six" label="six" data-testid="six" />
                </TreeItem>
              </TreeItem>
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'End' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-six');
        });
      });

      describe('type-ahead functionality', () => {
        it('moves focus to the next node with a name that starts with the typed character', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label={<span>two</span>} data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 't' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'f' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-four');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'o' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');
        });

        it('moves focus to the next node with the same starting character', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-one');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 't' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 't' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-three');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 't' });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
        });

        it('should not move focus when pressing a modifier key + letter', () => {
          render(
            <TreeView id="tree">
              <TreeItem nodeId="apple" label="apple" data-testid="apple" />
              <TreeItem nodeId="lemon" label="lemon" data-testid="lemon" />
              <TreeItem nodeId="coconut" label="coconut" data-testid="coconut" />
              <TreeItem nodeId="vanilla" label="vanilla" data-testid="vanilla" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-apple');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'v', ctrlKey: true });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-apple');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'v', metaKey: true });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-apple');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'v', shiftKey: true });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-apple');
        });

        it('should not throw when an item is removed', () => {
          function TestComponent() {
            const [hide, setState] = React.useState(false);
            return (
              <React.Fragment>
                <button type="button" onClick={() => setState(true)}>
                  Hide
                </button>
                <TreeView id="tree">
                  {!hide && <TreeItem nodeId="hide" label="ab" />}
                  <TreeItem nodeId="keyDown" label="keyDown" data-testid="keyDown" />
                  <TreeItem nodeId="navTo" data-testid="navTo" label="ac" />
                </TreeView>
              </React.Fragment>
            );
          }

          render(<TestComponent />);
          fireEvent.click(screen.getByText('Hide'));
          const navTreeItem = screen.getByTestId('navTo');
          expect(navTreeItem).not.toHaveFocus();

          expect(() => {
            screen.getByRole('tree').focus();
            expect(screen.getByRole('tree')).to.have.attribute(
              'aria-activedescendant',
              'tree-keyDown',
            );
            fireEvent.keyDown(screen.getByRole('tree'), { key: 'a' });
          }).not.to.throw();

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-navTo');
        });
      });

      describe('asterisk key interaction', () => {
        it('expands all siblings that are at the same level as the current node', () => {
          const toggleSpy = spy();
          render(
            <TreeView onNodeToggle={toggleSpy}>
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
              <TreeItem nodeId="three" label="three" data-testid="three">
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six">
                  <TreeItem nodeId="seven" label="seven" data-testid="seven" />
                </TreeItem>
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'false');
          expect(screen.getByTestId('three')).to.have.attribute('aria-expanded', 'false');
          expect(screen.getByTestId('five')).to.have.attribute('aria-expanded', 'false');

          fireEvent.keyDown(screen.getByRole('tree'), { key: '*' });

          expect(toggleSpy.args[0][1]).to.have.length(3);

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');
          expect(screen.getByTestId('three')).to.have.attribute('aria-expanded', 'true');
          expect(screen.getByTestId('five')).to.have.attribute('aria-expanded', 'true');
          expect(screen.getByTestId('six')).to.have.attribute('aria-expanded', 'false');
          expect(screen.getByTestId('eight')).not.to.have.attribute('aria-expanded');
        });
      });
    });

    describe('Expansion', () => {
      describe('enter key interaction', () => {
        it('expands a node with children', () => {
          render(
            <TreeView>
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'false');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'Enter' });

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');
        });

        it('collapses a node with children', () => {
          render(
            <TreeView>
              <TreeItem nodeId="one" label="one" data-testid="one">
                <TreeItem nodeId="two" label="two" data-testid="two" />
              </TreeItem>
            </TreeView>,
          );

          fireEvent.click(screen.getByText('one'));
          screen.getByRole('tree').focus();

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'true');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'Enter' });

          expect(screen.getByTestId('one')).to.have.attribute('aria-expanded', 'false');
        });
      });
    });

    describe('Single Selection', () => {
      describe('keyboard', () => {
        it('should select a node when space is pressed', () => {
          render(
            <TreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByTestId('one')).to.not.have.attribute('aria-selected');

          fireEvent.keyDown(screen.getByRole('tree'), { key: ' ' });

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
        });

        it('should not select a node when space is pressed and disableSelection', () => {
          render(
            <TreeView disableSelection>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: ' ' });

          expect(screen.getByTestId('one')).not.to.have.attribute('aria-selected');
        });
      });

      describe('mouse', () => {
        it('should select a node when click', () => {
          render(
            <TreeView>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.not.have.attribute('aria-selected');
          fireEvent.click(screen.getByText('one'));
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
        });

        it('should not select a node when click and disableSelection', () => {
          render(
            <TreeView disableSelection>
              <TreeItem nodeId="one" label="one" data-testid="one" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('one'));
          expect(screen.getByTestId('one')).not.to.have.attribute('aria-selected');
        });
      });
    });

    describe('Multi Selection', () => {
      describe('range selection', () => {
        specify('keyboard arrow', () => {
          render(
            <TreeView multiSelect defaultExpanded={['two']} id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('three'));
          screen.getByRole('tree').focus();

          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-four');
          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(2);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(3);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-four');
          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(2);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(1);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(2);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('four')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'false');
          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(3);
        });

        specify('keyboard arrow does not select when selectionDisabled', () => {
          render(
            <TreeView disableSelection multiSelect id="tree">
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('three'));
          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown', shiftKey: true });
          expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');
          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        });

        specify('keyboard arrow merge', () => {
          render(
            <TreeView multiSelect defaultExpanded={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
              <TreeItem nodeId="three" label="three" data-testid="three" />
              <TreeItem nodeId="four" label="four" data-testid="four" />
              <TreeItem nodeId="five" label="five" data-testid="five" />
              <TreeItem nodeId="six" label="six" data-testid="six" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('three'));
          screen.getByRole('tree').focus();

          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.click(screen.getByText('six'), { ctrlKey: true });
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp', shiftKey: true });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(5);

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown', shiftKey: true });
          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown', shiftKey: true });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(3);
        });

        specify('keyboard space', () => {
          render(
            <TreeView multiSelect defaultExpanded={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('five'));
          screen.getByRole('tree').focus();
          for (let i = 0; i < 5; i += 1) {
            fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown' });
          }
          fireEvent.keyDown(screen.getByRole('tree'), { key: ' ', shiftKey: true });

          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('six')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('seven')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('eight')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('nine')).to.have.attribute('aria-selected', 'true');
          for (let i = 0; i < 9; i += 1) {
            fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowUp' });
          }
          fireEvent.keyDown(screen.getByRole('tree'), { key: ' ', shiftKey: true });
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('six')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('seven')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('eight')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('nine')).to.have.attribute('aria-selected', 'false');
        });

        it('keyboard home and end', () => {
          render(
            <TreeView multiSelect defaultExpanded={['two', 'five']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </TreeView>,
          );

          // Focus node five
          fireEvent.click(screen.getByText('five'));
          fireEvent.click(screen.getByText('five'));
          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('six')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('seven')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('eight')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('nine')).to.have.attribute('aria-selected', 'true');

          fireEvent.keyDown(screen.getByRole('tree'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('six')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('seven')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('eight')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('nine')).to.have.attribute('aria-selected', 'false');
        });

        specify('keyboard home and end do not select when selectionDisabled', () => {
          render(
            <TreeView disableSelection multiSelect defaultExpanded={['two', 'five']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </TreeView>,
          );

          // Focus node five
          fireEvent.click(screen.getByText('five'));
          fireEvent.click(screen.getByText('five'));
          screen.getByRole('tree').focus();
          fireEvent.keyDown(screen.getByRole('tree'), {
            key: 'End',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);

          fireEvent.keyDown(screen.getByRole('tree'), {
            key: 'Home',
            shiftKey: true,
            ctrlKey: true,
          });

          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        });

        specify('mouse', () => {
          render(
            <TreeView multiSelect defaultExpanded={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('five'));
          fireEvent.click(screen.getByText('nine'), { shiftKey: true });
          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('six')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('seven')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('eight')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('nine')).to.have.attribute('aria-selected', 'true');
          fireEvent.click(screen.getByText('one'), { shiftKey: true });
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('three')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('four')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('five')).to.have.attribute('aria-selected', 'true');
        });

        specify('mouse does not range select when selectionDisabled', () => {
          render(
            <TreeView disableSelection multiSelect defaultExpanded={['two']}>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two">
                <TreeItem nodeId="three" label="three" data-testid="three" />
                <TreeItem nodeId="four" label="four" data-testid="four" />
              </TreeItem>
              <TreeItem nodeId="five" label="five" data-testid="five">
                <TreeItem nodeId="six" label="six" data-testid="six" />
                <TreeItem nodeId="seven" label="seven" data-testid="seven" />
              </TreeItem>
              <TreeItem nodeId="eight" label="eight" data-testid="eight" />
              <TreeItem nodeId="nine" label="nine" data-testid="nine" />
            </TreeView>,
          );

          fireEvent.click(screen.getByText('five'));
          fireEvent.click(screen.getByText('nine'), { shiftKey: true });
          expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);
        });
      });

      describe('multi selection', () => {
        specify('keyboard', () => {
          render(
            <TreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </TreeView>,
          );

          screen.getByRole('tree').focus();

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.keyDown(screen.getByRole('tree'), { key: ' ' });

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'false');

          fireEvent.keyDown(screen.getByRole('tree'), { key: 'ArrowDown' });
          fireEvent.keyDown(screen.getByRole('tree'), { key: ' ', ctrlKey: true });

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });

        specify('mouse using ctrl', () => {
          render(
            <TreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(screen.getByText('one'));
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(screen.getByText('two'), { ctrlKey: true });
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });

        specify('mouse using meta', () => {
          render(
            <TreeView multiSelect>
              <TreeItem nodeId="one" label="one" data-testid="one" />
              <TreeItem nodeId="two" label="two" data-testid="two" />
            </TreeView>,
          );

          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'false');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(screen.getByText('one'));
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'false');
          fireEvent.click(screen.getByText('two'), { metaKey: true });
          expect(screen.getByTestId('one')).to.have.attribute('aria-selected', 'true');
          expect(screen.getByTestId('two')).to.have.attribute('aria-selected', 'true');
        });
      });

      specify('ctrl + a selects all', () => {
        render(
          <TreeView multiSelect>
            <TreeItem nodeId="one" label="one" data-testid="one" />
            <TreeItem nodeId="two" label="two" data-testid="two" />
            <TreeItem nodeId="three" label="three" data-testid="three" />
            <TreeItem nodeId="four" label="four" data-testid="four" />
            <TreeItem nodeId="five" label="five" data-testid="five" />
          </TreeView>,
        );

        screen.getByRole('tree').focus();
        fireEvent.keyDown(screen.getByRole('tree'), { key: 'a', ctrlKey: true });

        expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(5);
      });

      specify('ctrl + a does not select all when disableSelection', () => {
        render(
          <TreeView disableSelection multiSelect>
            <TreeItem nodeId="one" label="one" data-testid="one" />
            <TreeItem nodeId="two" label="two" data-testid="two" />
            <TreeItem nodeId="three" label="three" data-testid="three" />
            <TreeItem nodeId="four" label="four" data-testid="four" />
            <TreeItem nodeId="five" label="five" data-testid="five" />
          </TreeView>,
        );

        screen.getByRole('tree').focus();
        fireEvent.keyDown(screen.getByRole('tree'), { key: 'a', ctrlKey: true });

        expect(screen.queryAllByRole('treeitem', { selected: true })).to.have.length(0);
      });
    });
  });

  it('should be able to type in an child input', () => {
    render(
      <TreeView defaultExpanded={['one']}>
        <TreeItem nodeId="one" label="one" data-testid="one">
          <TreeItem
            nodeId="two"
            label={
              <div>
                <input type="text" />
              </div>
            }
            data-testid="two"
          />
        </TreeItem>
      </TreeView>,
    );
    const input = screen.getByRole('textbox');
    const keydownEvent = createEvent.keyDown(input, {
      key: 'a',
    });
    keydownEvent.preventDefault = spy();
    fireEvent(input, keydownEvent);
    expect(keydownEvent.preventDefault.callCount).to.equal(0);
  });

  it('should not focus steal', () => {
    let setActiveItemMounted;
    // a TreeItem whose mounted state we can control with `setActiveItemMounted`
    function ControlledTreeItem(props) {
      const [mounted, setMounted] = React.useState(true);
      setActiveItemMounted = setMounted;

      if (!mounted) {
        return null;
      }
      return <TreeItem {...props} />;
    }
    render(
      <React.Fragment>
        <button type="button">Some focusable element</button>
        <TreeView id="tree">
          <TreeItem nodeId="one" label="one" data-testid="one" />
          <ControlledTreeItem nodeId="two" label="two" data-testid="two" />
        </TreeView>
      </React.Fragment>,
    );

    fireEvent.click(screen.getByText('two'));

    expect(screen.getByRole('tree')).to.have.attribute('aria-activedescendant', 'tree-two');

    screen.getByRole('button').focus();

    expect(screen.getByRole('button')).toHaveFocus();

    act(() => {
      setActiveItemMounted(false);
    });
    act(() => {
      setActiveItemMounted(true);
    });

    expect(screen.getByRole('button')).toHaveFocus();
  });
});
