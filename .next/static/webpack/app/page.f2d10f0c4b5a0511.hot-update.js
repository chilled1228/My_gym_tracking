"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/page",{

/***/ "(app-pages-browser)/./lib/utils.ts":
/*!**********************!*\
  !*** ./lib/utils.ts ***!
  \**********************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   cn: () => (/* binding */ cn),\n/* harmony export */   isLocalStorageAvailable: () => (/* binding */ isLocalStorageAvailable),\n/* harmony export */   safeGetItem: () => (/* binding */ safeGetItem),\n/* harmony export */   safeSetItem: () => (/* binding */ safeSetItem)\n/* harmony export */ });\n/* harmony import */ var clsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! clsx */ \"(app-pages-browser)/./node_modules/clsx/dist/clsx.mjs\");\n/* harmony import */ var tailwind_merge__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! tailwind-merge */ \"(app-pages-browser)/./node_modules/tailwind-merge/dist/bundle-mjs.mjs\");\n\n\nfunction cn() {\n    for(var _len = arguments.length, inputs = new Array(_len), _key = 0; _key < _len; _key++){\n        inputs[_key] = arguments[_key];\n    }\n    return (0,tailwind_merge__WEBPACK_IMPORTED_MODULE_1__.twMerge)((0,clsx__WEBPACK_IMPORTED_MODULE_0__.clsx)(inputs));\n}\n/**\n * Checks if localStorage is available in the current environment\n * @returns boolean indicating if localStorage is available\n */ function isLocalStorageAvailable() {\n    try {\n        const testKey = '__storage_test__';\n        localStorage.setItem(testKey, testKey);\n        localStorage.removeItem(testKey);\n        return true;\n    } catch (e) {\n        return false;\n    }\n}\n/**\n * Safely gets an item from localStorage\n * @param key The key to retrieve from localStorage\n * @param defaultValue Default value to return if item doesn't exist or localStorage is unavailable\n * @returns The stored value or defaultValue\n */ function safeGetItem(key, defaultValue) {\n    try {\n        if (!isLocalStorageAvailable()) return defaultValue;\n        const item = localStorage.getItem(key);\n        if (item === null) return defaultValue;\n        return JSON.parse(item);\n    } catch (e) {\n        console.error(\"Error getting item \".concat(key, \" from localStorage:\"), e);\n        return defaultValue;\n    }\n}\n/**\n * Safely sets an item in localStorage\n * @param key The key to set in localStorage\n * @param value The value to store\n * @returns boolean indicating if the operation was successful\n */ function safeSetItem(key, value) {\n    try {\n        if (!isLocalStorageAvailable()) return false;\n        localStorage.setItem(key, JSON.stringify(value));\n        return true;\n    } catch (e) {\n        console.error(\"Error setting item \".concat(key, \" in localStorage:\"), e);\n        return false;\n    }\n}\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = module.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = module.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, module.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                module.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                module.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        module.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    module.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2xpYi91dGlscy50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBNEM7QUFDSjtBQUVqQyxTQUFTRTtJQUFHO1FBQUdDLE9BQUgsdUJBQXVCOztJQUN4QyxPQUFPRix1REFBT0EsQ0FBQ0QsMENBQUlBLENBQUNHO0FBQ3RCO0FBRUE7OztDQUdDLEdBQ00sU0FBU0M7SUFDZCxJQUFJO1FBQ0YsTUFBTUMsVUFBVTtRQUNoQkMsYUFBYUMsT0FBTyxDQUFDRixTQUFTQTtRQUM5QkMsYUFBYUUsVUFBVSxDQUFDSDtRQUN4QixPQUFPO0lBQ1QsRUFBRSxPQUFPSSxHQUFHO1FBQ1YsT0FBTztJQUNUO0FBQ0Y7QUFFQTs7Ozs7Q0FLQyxHQUNNLFNBQVNDLFlBQWVDLEdBQVcsRUFBRUMsWUFBZTtJQUN6RCxJQUFJO1FBQ0YsSUFBSSxDQUFDUiwyQkFBMkIsT0FBT1E7UUFFdkMsTUFBTUMsT0FBT1AsYUFBYVEsT0FBTyxDQUFDSDtRQUNsQyxJQUFJRSxTQUFTLE1BQU0sT0FBT0Q7UUFFMUIsT0FBT0csS0FBS0MsS0FBSyxDQUFDSDtJQUNwQixFQUFFLE9BQU9KLEdBQUc7UUFDVlEsUUFBUUMsS0FBSyxDQUFDLHNCQUEwQixPQUFKUCxLQUFJLHdCQUFzQkY7UUFDOUQsT0FBT0c7SUFDVDtBQUNGO0FBRUE7Ozs7O0NBS0MsR0FDTSxTQUFTTyxZQUFlUixHQUFXLEVBQUVTLEtBQVE7SUFDbEQsSUFBSTtRQUNGLElBQUksQ0FBQ2hCLDJCQUEyQixPQUFPO1FBRXZDRSxhQUFhQyxPQUFPLENBQUNJLEtBQUtJLEtBQUtNLFNBQVMsQ0FBQ0Q7UUFDekMsT0FBTztJQUNULEVBQUUsT0FBT1gsR0FBRztRQUNWUSxRQUFRQyxLQUFLLENBQUMsc0JBQTBCLE9BQUpQLEtBQUksc0JBQW9CRjtRQUM1RCxPQUFPO0lBQ1Q7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL2JpcHVsa3VtYXIvRG9jdW1lbnRzL1RyYWNrZXIvbGliL3V0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHR5cGUgQ2xhc3NWYWx1ZSwgY2xzeCB9IGZyb20gXCJjbHN4XCJcbmltcG9ydCB7IHR3TWVyZ2UgfSBmcm9tIFwidGFpbHdpbmQtbWVyZ2VcIlxuXG5leHBvcnQgZnVuY3Rpb24gY24oLi4uaW5wdXRzOiBDbGFzc1ZhbHVlW10pIHtcbiAgcmV0dXJuIHR3TWVyZ2UoY2xzeChpbnB1dHMpKVxufVxuXG4vKipcbiAqIENoZWNrcyBpZiBsb2NhbFN0b3JhZ2UgaXMgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50IGVudmlyb25tZW50XG4gKiBAcmV0dXJucyBib29sZWFuIGluZGljYXRpbmcgaWYgbG9jYWxTdG9yYWdlIGlzIGF2YWlsYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNMb2NhbFN0b3JhZ2VBdmFpbGFibGUoKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdGVzdEtleSA9ICdfX3N0b3JhZ2VfdGVzdF9fJztcbiAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSh0ZXN0S2V5LCB0ZXN0S2V5KTtcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSh0ZXN0S2V5KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIFNhZmVseSBnZXRzIGFuIGl0ZW0gZnJvbSBsb2NhbFN0b3JhZ2VcbiAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byByZXRyaWV2ZSBmcm9tIGxvY2FsU3RvcmFnZVxuICogQHBhcmFtIGRlZmF1bHRWYWx1ZSBEZWZhdWx0IHZhbHVlIHRvIHJldHVybiBpZiBpdGVtIGRvZXNuJ3QgZXhpc3Qgb3IgbG9jYWxTdG9yYWdlIGlzIHVuYXZhaWxhYmxlXG4gKiBAcmV0dXJucyBUaGUgc3RvcmVkIHZhbHVlIG9yIGRlZmF1bHRWYWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZUdldEl0ZW08VD4oa2V5OiBzdHJpbmcsIGRlZmF1bHRWYWx1ZTogVCk6IFQge1xuICB0cnkge1xuICAgIGlmICghaXNMb2NhbFN0b3JhZ2VBdmFpbGFibGUoKSkgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICBcbiAgICBjb25zdCBpdGVtID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICBpZiAoaXRlbSA9PT0gbnVsbCkgcmV0dXJuIGRlZmF1bHRWYWx1ZTtcbiAgICBcbiAgICByZXR1cm4gSlNPTi5wYXJzZShpdGVtKSBhcyBUO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgZ2V0dGluZyBpdGVtICR7a2V5fSBmcm9tIGxvY2FsU3RvcmFnZTpgLCBlKTtcbiAgICByZXR1cm4gZGVmYXVsdFZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogU2FmZWx5IHNldHMgYW4gaXRlbSBpbiBsb2NhbFN0b3JhZ2VcbiAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzZXQgaW4gbG9jYWxTdG9yYWdlXG4gKiBAcGFyYW0gdmFsdWUgVGhlIHZhbHVlIHRvIHN0b3JlXG4gKiBAcmV0dXJucyBib29sZWFuIGluZGljYXRpbmcgaWYgdGhlIG9wZXJhdGlvbiB3YXMgc3VjY2Vzc2Z1bFxuICovXG5leHBvcnQgZnVuY3Rpb24gc2FmZVNldEl0ZW08VD4oa2V5OiBzdHJpbmcsIHZhbHVlOiBUKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgaWYgKCFpc0xvY2FsU3RvcmFnZUF2YWlsYWJsZSgpKSByZXR1cm4gZmFsc2U7XG4gICAgXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBKU09OLnN0cmluZ2lmeSh2YWx1ZSkpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3Igc2V0dGluZyBpdGVtICR7a2V5fSBpbiBsb2NhbFN0b3JhZ2U6YCwgZSk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG4iXSwibmFtZXMiOlsiY2xzeCIsInR3TWVyZ2UiLCJjbiIsImlucHV0cyIsImlzTG9jYWxTdG9yYWdlQXZhaWxhYmxlIiwidGVzdEtleSIsImxvY2FsU3RvcmFnZSIsInNldEl0ZW0iLCJyZW1vdmVJdGVtIiwiZSIsInNhZmVHZXRJdGVtIiwia2V5IiwiZGVmYXVsdFZhbHVlIiwiaXRlbSIsImdldEl0ZW0iLCJKU09OIiwicGFyc2UiLCJjb25zb2xlIiwiZXJyb3IiLCJzYWZlU2V0SXRlbSIsInZhbHVlIiwic3RyaW5naWZ5Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./lib/utils.ts\n"));

/***/ })

});