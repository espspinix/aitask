import log from 'loglevel';
import colorize from 'json-colorizer';
import ProgressBar from 'progress';

// Create a custom logger with verbosity control using loglevel
// const logger = log.getLogger('logger');

// Set default log level (can be changed later)
log.setLevel(log.levels.WARN);

// Enhanced log object with JSON colorization
const loggerFunctions = {
  progessAwareLog: (func, msg) => {
    if(progressbar.bar && !progressbar.complete) {
      progressbar.bar.interrupt(msg)
      return
    }

    func(msg)
  },
  trace: (message) => {
    if (log.getLevel() <= log.levels.TRACE) {
      loggerFunctions.progessAwareLog(log.trace, formatMessage(message))
    }
  },
  debug: (message) => {
    if (log.getLevel() <= log.levels.DEBUG) {
      loggerFunctions.progessAwareLog(log.debug, formatMessage(message))
    }
  },
  info: (message) => {
    if (log.getLevel() <= log.levels.INFO) {
      loggerFunctions.progessAwareLog(log.info, formatMessage(message))
    }
  },
  warn: (message, ...args) => {
    if (log.getLevel() <= log.levels.WARN) {
      loggerFunctions.progessAwareLog(log.warn, formatMessage(message, ...args))
    }
  },
  error: (message) => {
    if (log.getLevel() <= log.levels.ERROR) {
      loggerFunctions.progessAwareLog(log.error, formatMessage(message))
    }
  },
  silent: (message) => {
    log.setLevel(log.levels.SILENT);
    loggerFunctions.progessAwareLog(log.debug, formatMessage(message))
  },
  // Log function to handle multiple parameters, similar to console.log
  log: (...args) => {
    loggerFunctions.warn(...args);  // Log as info, similar to console.log
  },
  dir: (message, options) => {
    loggerFunctions.info(message)
  },
  levels: log.levels,
  setLevel: log.setLevel,
};

// Function to format messages (checks if the message is JSON or an array and colorizes)
const formatMessage = (message, ...args) => {
  if (args.length > 0) {
    return message + ' ' + args.reduce((sum, arg) => (sum + ' ' + formatMessage(arg)), '')
  }

  if (Array.isArray(message) || typeof message === 'object') {
    // Use JSON.stringify with full depth (no limit on depth)
    const formattedMessage = JSON.stringify(message, null, 2); // Full depth
    return colorize.colorize(formattedMessage); // Colorize the JSON output
  }
  return message;
};

// Progress bar functionality
const progressbar = {
  bar: null,
  start: (totalItems) => {
    const bar = new ProgressBar(':current/:total [:bar] :percent :elapseds :etas - :itemName ( :currTask )', {
      total: totalItems,
      width: 40,
      incomplete: ' ',
      complete: '=',
      renderThrottle: 100,
      itemName: '--',
      currTask: '--',
    });

    bar.itemName = '--'
    bar.currTask = '--'

    if(progressbar.bar) {
      progressbar.bar.terminate()
    }

    progressbar.bar = bar

    bar.tick(0, {
      itemName: bar.itemName,
      currTask: bar.currTask
    })

    return { bar, totalItems };
  },

  next: (itemName, customBar = null) => {
    customBar = customBar ? customBar : progressbar.bar
    customBar.tick({ 
      itemName: itemName,
      currTask: 'Done'
     });
  },

  task: (itemName, currTask, customBar = null) => {
    customBar = customBar ? customBar : progressbar.bar
    customBar.render({ 
      itemName,
      currTask
    }, true)
  }
};

// Export the logger and progressbar functionality
export { loggerFunctions as logger, progressbar };
