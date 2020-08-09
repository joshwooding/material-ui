import * as React from 'react';
import clsx from 'clsx';
import withStyles from '../styles/withStyles';

const styles = (theme) => ({
  thumb: {
    '&$open': {
      '& $offset': {
        transform: 'scale(1) translateY(-10px)',
      },
    },
  },
  open: {},
  offset: {
    zIndex: 1,
    ...theme.typography.body2,
    fontSize: theme.typography.pxToRem(12),
    lineHeight: 1.2,
    transition: theme.transitions.create(['transform'], {
      duration: theme.transitions.duration.shortest,
    }),
    top: -34,
    transformOrigin: 'bottom left',
    transform: 'scale(0)',
    position: 'absolute',
  },
  square: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6e6e6e',
    borderRadius: 2,
    position: 'relative',
    left: '-50%',
  },
  label: {
    color: theme.palette.common.white,
    padding: '8px 12px',
  },
  arrow: {
    position: 'absolute',
    width: '1em',
    height: '0.71em' /* = width / sqrt(2) = (length of the hypotenuse) */,
    boxSizing: 'border-box',
    color: '#6e6e6e',
    bottom: 0,
    left: 0,
    marginBottom: '-0.71em',
    marginLeft: 'calc(50% - 0.5em)',
    marginRight: 'calc(50% - 0.5em)',
    '&::before': {
      content: '""',
      margin: 'auto',
      display: 'block',
      width: '100%',
      height: '100%',
      backgroundColor: 'currentColor',
      transform: 'rotate(45deg)',
      transformOrigin: '100% 0',
    },
  },
});

/**
 * @ignore - internal component.
 */
function ValueLabel(props) {
  const { children, classes, className, open, value, valueLabelDisplay } = props;

  if (valueLabelDisplay === 'off') {
    return children;
  }

  return React.cloneElement(
    children,
    {
      className: clsx(
        children.props.className,
        {
          [classes.open]: open || valueLabelDisplay === 'on',
        },
        classes.thumb,
      ),
    },
    <span className={clsx(classes.offset, className)}>
      <span className={classes.square}>
        <span className={classes.label}>{value}</span>
        <span className={classes.arrow} />
      </span>
    </span>,
  );
}

export default withStyles(styles, { name: 'PrivateValueLabel' })(ValueLabel);
