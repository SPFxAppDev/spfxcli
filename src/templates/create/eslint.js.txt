require('@rushstack/eslint-config/patch/modern-module-resolution');
module.exports = {
  extends: ['./ms-eslint.js'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        '@rushstack/no-new-null': 0,
        // STANDARDIZED BY:   @typescript-eslint\eslint-plugin\dist\configs\recommended.json
        //
        // RATIONALE:         The "any" keyword disables static type checking, the main benefit of using TypeScript.
        //                    This rule should be suppressed only in very special cases such as JSON.stringify()
        //                    where the type really can be anything.  Even if the type is flexible, another type
        //                    may be more appropriate such as "unknown", "{}", or "Record<k,V>".
        '@typescript-eslint/no-explicit-any': 0,
        // RATIONALE:         The #1 rule of promises is that every promise chain must be terminated by a catch()
        //                    handler.  Thus wherever a Promise arises, the code must either append a catch handler,
        //                    or else return the object to a caller (who assumes this responsibility).  Unterminated
        //                    promise chains are a serious issue.  Besides causing errors to be silently ignored,
        //                    they can also cause a NodeJS process to terminate unexpectedly.
        '@typescript-eslint/no-floating-promises': 0,
        // RATIONALE:         When left in shipping code, unused variables often indicate a mistake.  Dead code
        //                    may impact performance.
        //
        // STANDARDIZED BY:   @typescript-eslint\eslint-plugin\dist\configs\recommended.json
        '@typescript-eslint/no-unused-vars': [
          0,
          {
            vars: 'all',
            // Unused function arguments often indicate a mistake in JavaScript code.  However in TypeScript code,
            // the compiler catches most of those mistakes, and unused arguments are fairly common for type signatures
            // that are overriding a base class method or implementing an interface.
            args: 'none',
          },
        ],
      },
    },
  ],
};