export interface IHeftLifecyclePluginLocal {
  apply(lifecycleSession: any, heftConfiguration: any): void;
}

export default class DisableWarningsPlugin implements IHeftLifecyclePluginLocal {
  public apply(lifecycleSession: any, heftConfiguration: any): void {
    disableWarningsCommandDefinition();
  }
}

export const disableWarningsCommandDefinition = (): void => {
  const argv = process.argv;
  const warningLevel = argv.some((arg) => arg === '--warnoff');

  if (!warningLevel) {
    return;
  }

  console.log(
    '\x1b[33m IMPORTANT: Warnings will not fail the build and yellow warning output is suppressed. \x1b[0m',
  );

  // 1. Patch Terminal.prototype.writeWarning & writeWarningLine from @rushstack/terminal
  const patchTerminal = (modExports: any) => {
    if (modExports && modExports.Terminal && modExports.Terminal.prototype) {
      modExports.Terminal.prototype.writeWarning = function () {
        // No-op: Suppress all terminal warnings
      };
      modExports.Terminal.prototype.writeWarningLine = function () {
        // No-op: Suppress all terminal warning lines
      };
    }
  };

  // 2. Patch ScopedLogger & LoggingManager from @rushstack/heft
  const patchHeftLogging = (modExports: any) => {
    if (modExports) {
      if (modExports.ScopedLogger && modExports.ScopedLogger.prototype) {
        modExports.ScopedLogger.prototype.emitWarning = function () {
          // No-op
        };
      }
      if (modExports.LoggingManager && modExports.LoggingManager.prototype) {
        modExports.LoggingManager.prototype.getWarningStrings = function () {
          return [];
        };
      }
    }
  };

  // Patch modules already loaded in require.cache
  try {
    const cacheKeys = Object.keys(require.cache);
    for (const key of cacheKeys) {
      const modExports = require.cache[key]?.exports;
      patchTerminal(modExports);
      patchHeftLogging(modExports);
    }
  } catch {
    // Ignore
  }

  // Intercept module loading for any future requires
  try {
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function (pathStr: string) {
      const modExports = originalRequire.apply(this, arguments);
      patchTerminal(modExports);
      patchHeftLogging(modExports);
      return modExports;
    };
  } catch {
    // Ignore
  }

  // 3. Filter stdout & stderr streams for any yellow ANSI lines (\x1b[33m or \u001b[33m or \x1b[93m)
  const isYellowOrWarningLine = (str: string): boolean => {
    return (
      str.includes('\x1b[33m') ||
      str.includes('\u001b[33m') ||
      str.includes('\x1b[93m') ||
      str.includes('\u001b[93m') ||
      str.includes('[warning]') ||
      str.includes('Warning') ||
      str.includes('warning') ||
      str.includes('WARNING') ||
      str.includes('[build:lint]') ||
      str.includes('[build:typescript]') ||
      str.includes('@typescript-eslint') ||
      /\bwarning\b/i.test(str)
    );
  };

  const filterWarningStream = (originalWrite: any, stream: any) => {
    return function (chunk: any, encoding?: any, callback?: any) {
      const str = typeof chunk === 'string' ? chunk : chunk?.toString() || '';
      if (isYellowOrWarningLine(str)) {
        if (typeof encoding === 'function') {
          encoding();
        } else if (typeof callback === 'function') {
          callback();
        }
        return true;
      }
      return originalWrite.apply(stream, arguments);
    };
  };

  process.stdout.write = filterWarningStream(process.stdout.write, process.stdout) as any;
  process.stderr.write = filterWarningStream(process.stderr.write, process.stderr) as any;
};
