module.exports = {

"[project]/frontend/components/ui/avatar.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Avatar": (()=>Avatar),
    "AvatarFallback": (()=>AvatarFallback),
    "AvatarImage": (()=>AvatarImage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-avatar/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
const Avatar = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/avatar.tsx",
        lineNumber: 12,
        columnNumber: 3
    }, this));
Avatar.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"].displayName;
const AvatarImage = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Image"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("aspect-square h-full w-full", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/avatar.tsx",
        lineNumber: 27,
        columnNumber: 3
    }, this));
AvatarImage.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Image"].displayName;
const AvatarFallback = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fallback"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex h-full w-full items-center justify-center rounded-full bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/avatar.tsx",
        lineNumber: 39,
        columnNumber: 3
    }, this));
AvatarFallback.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$avatar$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fallback"].displayName;
;
}}),
"[project]/frontend/components/ui/card.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "Card": (()=>Card),
    "CardContent": (()=>CardContent),
    "CardDescription": (()=>CardDescription),
    "CardFooter": (()=>CardFooter),
    "CardHeader": (()=>CardHeader),
    "CardTitle": (()=>CardTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("rounded-lg border bg-card text-card-foreground shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/card.tsx",
        lineNumber: 9,
        columnNumber: 3
    }, this));
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/card.tsx",
        lineNumber: 24,
        columnNumber: 3
    }, this));
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-2xl font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/card.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, this));
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/card.tsx",
        lineNumber: 51,
        columnNumber: 3
    }, this));
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/card.tsx",
        lineNumber: 63,
        columnNumber: 3
    }, this));
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/card.tsx",
        lineNumber: 71,
        columnNumber: 3
    }, this));
CardFooter.displayName = "CardFooter";
;
}}),
"[project]/frontend/app/data:324fbe [app-ssr] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"707f687be101932e3a517e3e5724727d27e4ad5343":"getDailyObjectives"},"frontend/app/actions.ts",""] */ __turbopack_context__.s({
    "getDailyObjectives": (()=>getDailyObjectives)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-ssr] (ecmascript)");
"use turbopack no side effects";
;
var getDailyObjectives = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createServerReference"])("707f687be101932e3a517e3e5724727d27e4ad5343", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["findSourceMapURL"], "getDailyObjectives"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XHJcblxyXG5pbXBvcnQgeyBlbW90aW9uYWxBSUNvcGlsb3QgfSBmcm9tICdAL2FpL2Zsb3dzL2Vtb3Rpb25hbC1haS1jb3BpbG90JztcclxuaW1wb3J0IHsgcGVyc29uYWxpemVkT2JqZWN0aXZlcywgUGVyc29uYWxpemVkT2JqZWN0aXZlc0lucHV0IH0gZnJvbSAnQC9haS9mbG93cy9wZXJzb25hbGl6ZS1kYWlseS1vYmplY3RpdmVzJztcclxuaW1wb3J0IHsgeW91dHViZVNlYXJjaEZsb3cgfSBmcm9tICdAL2FpL2Zsb3dzL3lvdXR1YmUtc2VhcmNoLWZsb3cnO1xyXG5pbXBvcnQgeyBydW5GbG93IH0gZnJvbSAnQGdlbmtpdC1haS9mbG93JztcclxuaW1wb3J0IHR5cGUgeyBDb252ZXJzYXRpb25TdGF0ZSwgTWVzc2FnZSB9IGZyb20gJ0AvbGliL3R5cGVzJztcclxuaW1wb3J0IHByaXNtYSBmcm9tICdAL2xpYi9wcmlzbWEnO1xyXG5pbXBvcnQgeyBjb29raWVzIH0gZnJvbSAnbmV4dC9oZWFkZXJzJztcclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgdG8gc2F2ZSBtZXNzYWdlIHRvIERCIChtaW1pY3MgYmFja2VuZCBsb2dpYylcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHNhdmVNZXNzYWdlVG9EYihzZXNzaW9uSWQ6IHN0cmluZywgcm9sZTogJ3VzZXInIHwgJ21vZGVsJywgY29udGVudDogc3RyaW5nKSB7XHJcbiAgdHJ5IHtcclxuICAgIGlmICghc2Vzc2lvbklkKSByZXR1cm47XHJcblxyXG4gICAgY29uc3Qgc2Vzc2lvbkV4aXN0cyA9IGF3YWl0IHByaXNtYS5jaGF0U2Vzc2lvbi5maW5kVW5pcXVlKHtcclxuICAgICAgICB3aGVyZTogeyBpZDogc2Vzc2lvbklkIH0sXHJcbiAgICAgICAgc2VsZWN0OiB7IGlkOiB0cnVlIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghc2Vzc2lvbkV4aXN0cykge1xyXG4gICAgICAgIHJldHVybjsgXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY291bnQgPSBhd2FpdCBwcmlzbWEuY2hhdE1lc3NhZ2UuY291bnQoeyB3aGVyZTogeyBzZXNzaW9uSWQgfSB9KTtcclxuICAgIGF3YWl0IHByaXNtYS5jaGF0TWVzc2FnZS5jcmVhdGUoe1xyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgc2Vzc2lvbklkLFxyXG4gICAgICAgIHJvbGUsXHJcbiAgICAgICAgY29udGVudCxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgbWVzc2FnZU51bWJlcjogY291bnQgKyAxLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNhdmluZyBtZXNzYWdlIHRvIERCOicsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgdG8gdXBkYXRlIHNlc3Npb24gc3RhdGUgYW5kIHRpdGxlXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVTZXNzaW9uU3RhdGUoc2Vzc2lvbklkOiBzdHJpbmcsIHN0YXRlOiBDb252ZXJzYXRpb25TdGF0ZSwgdG9waWM/OiBzdHJpbmcsIHRpdGxlPzogc3RyaW5nKSB7XHJcbiAgaWYgKCFzZXNzaW9uSWQpIHJldHVybjtcclxuICBcclxuICAvLyDwn5SNIExPR0dJTkc6IENoZWNraW5nIHdoYXQgd2UgYXJlIHRyeWluZyB0byBzYXZlXHJcbiAgY29uc29sZS5sb2coYFtBQ1RJT04gTE9HXSBBdHRlbXB0aW5nIERCIFVwZGF0ZS4gSUQ6ICR7c2Vzc2lvbklkfSwgVGl0bGU6IFwiJHt0aXRsZX1cImApO1xyXG5cclxuICBjb25zdCBkYXRhOiBhbnkgPSB7IHVwZGF0ZWRBdDogbmV3IERhdGUoKSwgbWV0YWRhdGE6IHN0YXRlIH07XHJcbiAgXHJcbiAgLy8g4pyFIFVQREFURSBUSVRMRSBJRiBQUk9WSURFRFxyXG4gIGlmICh0aXRsZSAmJiB0aXRsZSAhPT0gXCJOZXcgQ2hhdFwiKSB7XHJcbiAgICAgIGRhdGEudG9waWMgPSB0aXRsZTsgLy8gTWFwICd0aXRsZScgdG8gJ3RvcGljJyBjb2x1bW5cclxuICB9XHJcbiAgXHJcbiAgLy8gVVBEQVRFIElOVEVSTkFMIFRPUElDIChJZiBzZXBhcmF0ZSBmcm9tIHRpdGxlKVxyXG4gIGlmICh0b3BpYyAmJiAhdGl0bGUpIHtcclxuICAgICAgZGF0YS50b3BpYyA9IHRvcGljO1xyXG4gIH1cclxuICBcclxuICBhd2FpdCBwcmlzbWEuY2hhdFNlc3Npb24udXBkYXRlKHtcclxuICAgIHdoZXJlOiB7IGlkOiBzZXNzaW9uSWQgfSxcclxuICAgIGRhdGEsXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8vIEZFVENIIE1FTU9SWSBIRUxQRVJcclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hTdHVkZW50TWVtb3J5KCkge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4geyBwcm9ncmVzczogW10sIG1pc3Rha2VzOiBbXSB9O1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJldHVybiB7IHByb2dyZXNzOiBbXSwgbWlzdGFrZXM6IFtdIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QXNzaXN0YW50UmVzcG9uc2UoXHJcbiAgc2Vzc2lvbklkOiBzdHJpbmcsXHJcbiAgbWVzc2FnZTogc3RyaW5nLFxyXG4gIGNoYXRIaXN0b3J5OiBNZXNzYWdlW10sXHJcbiAgY3VycmVudFN0YXRlOiBDb252ZXJzYXRpb25TdGF0ZSxcclxuICBmaWxlRGF0YUJhc2U2NDogeyB0eXBlOiBzdHJpbmc7IGJhc2U2NDogc3RyaW5nIH0gfCB1bmRlZmluZWQsXHJcbiAgZm9yY2VXZWJTZWFyY2g6IGJvb2xlYW4sXHJcbiAgaW5jbHVkZVZpZGVvczogYm9vbGVhbixcclxuICBwcmVmZXJlbmNlczoge1xyXG4gICAgbmFtZT86IHN0cmluZztcclxuICAgIGdyYWRlTGV2ZWw/OiAnUHJpbWFyeScgfCAnTG93ZXJTZWNvbmRhcnknIHwgJ1VwcGVyU2Vjb25kYXJ5JztcclxuICAgIHByZWZlcnJlZExhbmd1YWdlPzogJ2VuZ2xpc2gnIHwgJ3N3YWhpbGknIHwgJ2FyYWJpYycgfCAnZW5nbGlzaF9zdyc7XHJcbiAgICBpbnRlcmVzdHM/OiBzdHJpbmdbXTtcclxuICB9LFxyXG4gIHN0dWRlbnRNZW1vcnk6IHtcclxuICAgIHByb2dyZXNzOiBhbnlbXTtcclxuICAgIG1pc3Rha2VzOiBhbnlbXTtcclxuICB9XHJcbikge1xyXG4gIHRyeSB7XHJcbiAgICAvLyAxLiBTYXZlIFVzZXIgTWVzc2FnZSAoU2FmZWx5KVxyXG4gICAgaWYgKHNlc3Npb25JZCkge1xyXG4gICAgICAgIGF3YWl0IHNhdmVNZXNzYWdlVG9EYihzZXNzaW9uSWQsICd1c2VyJywgbWVzc2FnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g4pyFIEZFVENIIENVUlJFTlQgVElUTEUgVE8gUEFTUyBUTyBBSVxyXG4gICAgLy8gVGhpcyBhbGxvd3MgdGhlIEFJIHRvIGtub3cgaWYgaXQgbmVlZHMgdG8gZ2VuZXJhdGUgYSB0aXRsZSAoaWYgY3VycmVudCBpcyAnTmV3IENoYXQnKVxyXG4gICAgbGV0IGN1cnJlbnRUaXRsZSA9ICdOZXcgQ2hhdCc7XHJcbiAgICBpZiAoc2Vzc2lvbklkKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudFNlc3Npb24gPSBhd2FpdCBwcmlzbWEuY2hhdFNlc3Npb24uZmluZFVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgICB3aGVyZTogeyBpZDogc2Vzc2lvbklkIH0sXHJcbiAgICAgICAgICAgICAgICBzZWxlY3Q6IHsgdG9waWM6IHRydWUgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTZXNzaW9uPy50b3BpYykge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFRpdGxlID0gY3VycmVudFNlc3Npb24udG9waWM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSBEQiByZWFkIGVycm9yLCBkZWZhdWx0IHRvIE5ldyBDaGF0XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIDIuIFJ1biBBSVxyXG4gICAgY29uc29sZS5sb2coXCJbQUNUSU9OIExPR10gQ2FsbGluZyBFbW90aW9uYWwgQUkuLi5cIik7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGVtb3Rpb25hbEFJQ29waWxvdCh7XHJcbiAgICAgIHRleHQ6IG1lc3NhZ2UsXHJcbiAgICAgIGNoYXRIaXN0b3J5OiBjaGF0SGlzdG9yeSxcclxuICAgICAgc3RhdGU6IGN1cnJlbnRTdGF0ZSxcclxuICAgICAgcHJlZmVyZW5jZXM6IHByZWZlcmVuY2VzLFxyXG4gICAgICBmaWxlRGF0YTogZmlsZURhdGFCYXNlNjQsXHJcbiAgICAgIGZvcmNlV2ViU2VhcmNoLFxyXG4gICAgICBpbmNsdWRlVmlkZW9zLFxyXG4gICAgICBtZW1vcnk6IHN0dWRlbnRNZW1vcnksXHJcbiAgICAgIGN1cnJlbnRUaXRsZTogY3VycmVudFRpdGxlLFxyXG4gICAgICBzdHVkZW50UHJvZmlsZToge1xyXG4gICAgICAgIG5hbWU6IHByZWZlcmVuY2VzLm5hbWUgfHwgJ1N0dWRlbnQnLCAvLyBFbnN1cmUgbmFtZSBpcyBwYXNzZWRcclxuICAgICAgICBncmFkZUxldmVsOiBwcmVmZXJlbmNlcy5ncmFkZUxldmVsIHx8ICdQcmltYXJ5JyAvLyBFbnN1cmUgZ3JhZGUgaXMgcGFzc2VkXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGBbQUNUSU9OIExPR10gQUkgRmluaXNoZWQuIFN1Z2dlc3RlZCBUaXRsZTogXCIke3Jlc3BvbnNlLnN1Z2dlc3RlZFRpdGxlfVwiYCk7XHJcblxyXG4gICAgLy8gMy4gU2F2ZSBBSSBSZXNwb25zZSAmIFRyeSBVcGRhdGUgVGl0bGVcclxuICAgIGlmIChzZXNzaW9uSWQpIHtcclxuICAgICAgICBhd2FpdCBzYXZlTWVzc2FnZVRvRGIoc2Vzc2lvbklkLCAnbW9kZWwnLCByZXNwb25zZS5wcm9jZXNzZWRUZXh0KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDwn5uh77iPIENSSVRJQ0FMIEZJWDogVFJZL0NBVENIIEFST1VORCBEQiBVUERBVEVcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB1cGRhdGVTZXNzaW9uU3RhdGUoXHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWQsIFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc3RhdGUsIFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudG9waWMsIFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc3VnZ2VzdGVkVGl0bGUgXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBjYXRjaCAoZGJFcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLimqDvuI8gW0FDVElPTiBMT0ddIERCIFdyaXRlIEZhaWxlZCAoUkxTL0F1dGgpLiBSZXR1cm5pbmcgdGl0bGUgdG8gQ2xpZW50IGZvciBmYWxsYmFjayBzYXZlLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcHJvY2Vzc2VkVGV4dDogcmVzcG9uc2UucHJvY2Vzc2VkVGV4dCxcclxuICAgICAgdmlkZW9EYXRhOiByZXNwb25zZS52aWRlb0RhdGEgPz8gdW5kZWZpbmVkLFxyXG4gICAgICBzdGF0ZTogcmVzcG9uc2Uuc3RhdGUsXHJcbiAgICAgIC8vIOKchSBWSVRBTCBGSVg6IFBhc3Mgc3VnZ2VzdGVkVGl0bGUgYXMgJ3RvcGljJyBzbyBmcm9udGVuZCBkZXRlY3RzIGl0XHJcbiAgICAgIHRvcGljOiByZXNwb25zZS5zdWdnZXN0ZWRUaXRsZSB8fCByZXNwb25zZS50b3BpYyxcclxuICAgICAgc3VnZ2VzdGVkVGl0bGU6IHJlc3BvbnNlLnN1Z2dlc3RlZFRpdGxlIFxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tTRVJWRVIgQUNUSU9OIEZBVEFMIEVSUk9SXScsIGVycik7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBwcm9jZXNzZWRUZXh0OiAnSSBhbSBzb3JyeSwgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nIHdoaWxlIHByb2Nlc3NpbmcgdGhhdC4gQ291bGQgeW91IHRyeSBhZ2Fpbj8nLFxyXG4gICAgICB2aWRlb0RhdGE6IHVuZGVmaW5lZCxcclxuICAgICAgc3RhdGU6IGN1cnJlbnRTdGF0ZSxcclxuICAgICAgdG9waWM6IHVuZGVmaW5lZCxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGFpbHlPYmplY3RpdmVzKFxyXG4gIHN0dWRlbnRQZXJmb3JtYW5jZTogc3RyaW5nLFxyXG4gIGN1cnJpY3VsdW06IHN0cmluZyxcclxuICBsb2dnZWRNaXNjb25jZXB0aW9uczogc3RyaW5nXHJcbikge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBvYmplY3RpdmVzSW5wdXQ6IFBlcnNvbmFsaXplZE9iamVjdGl2ZXNJbnB1dCA9IHtcclxuICAgICAgc3R1ZGVudFBlcmZvcm1hbmNlLFxyXG4gICAgICBjdXJyaWN1bHVtLFxyXG4gICAgICBsb2dnZWRNaXNjb25jZXB0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZXJzb25hbGl6ZWRPYmplY3RpdmVzKG9iamVjdGl2ZXNJbnB1dCk7XHJcbiAgICByZXR1cm4gcmVzdWx0LmRhaWx5T2JqZWN0aXZlcztcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tTRVJWRVIgQUNUSU9OIEJSSURHRSBFUlJPUiAtIE9iamVjdGl2ZXNdJywgZXJyKTtcclxuICAgIHJldHVybiBbJ1JldmlldyB0b2RheVxcJ3Mga2V5IGNvbmNlcHRzLicsICdQcmFjdGljZSBvbmUgY29yZSBwcm9ibGVtLiddO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlYXJjaFlvdVR1YmUocXVlcnk6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgcnVuRmxvdyh5b3V0dWJlU2VhcmNoRmxvdywgeyBxdWVyeSB9KTtcclxuICAgIHJldHVybiByZXN1bHRzO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbU0VSVkVSIEFDVElPTiBCUklER0UgRVJST1IgLSBZb3VUdWJlXScsIGVycm9yKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIHsgQ29udmVyc2F0aW9uU3RhdGUsIE1lc3NhZ2UgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Im1TQStLc0IifQ==
}}),
"[project]/frontend/components/daily-objectives.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "DailyObjectives": (()=>DailyObjectives)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/card.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-ssr] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/check.js [app-ssr] (ecmascript) <export default as Check>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/sparkles.js [app-ssr] (ecmascript) <export default as Sparkles>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$data$3a$324fbe__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/frontend/app/data:324fbe [app-ssr] (ecmascript) <text/javascript>");
'use client';
;
;
;
;
;
;
;
function DailyObjectives() {
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    const [objectives, setObjectives] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isLoadingObjectives, setIsLoadingObjectives] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        async function fetchObjectives() {
            setIsLoadingObjectives(true);
            try {
                // TODO: Replace with actual dynamic data from student's profile or backend
                const studentPerformance = 'Student is excelling in basic algebra but struggles with word problems and applying concepts.';
                const curriculum = 'Today’s lesson is on applying linear equations to real-world scenarios.';
                const loggedMisconceptions = 'Difficulty in translating written descriptions into mathematical equations.';
                const fetchedObjectives = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$data$3a$324fbe__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getDailyObjectives"])(studentPerformance, curriculum, loggedMisconceptions);
                setObjectives(fetchedObjectives.map((q, i)=>({
                        id: `obj-${i}`,
                        description: q,
                        completed: false // Changed from 'isCompleted' to 'completed'
                    })));
            } catch (e) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Could not load daily objectives."
                });
            } finally{
                setIsLoadingObjectives(false);
            }
        }
        fetchObjectives();
    }, [
        toast
    ]);
    const toggleObjective = (id)=>{
        setObjectives(objectives.map((obj)=>obj.id === id ? {
                ...obj,
                completed: !obj.completed
            } : obj)); // Changed from 'isCompleted' to 'completed'
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Card"], {
        className: "mb-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardHeader"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardTitle"], {
                    className: "flex items-center gap-2 text-xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$sparkles$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Sparkles$3e$__["Sparkles"], {
                            className: "h-6 w-6 text-accent"
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/daily-objectives.tsx",
                            lineNumber: 55,
                            columnNumber: 21
                        }, this),
                        " Your Daily Objectives"
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/daily-objectives.tsx",
                    lineNumber: 54,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/daily-objectives.tsx",
                lineNumber: 53,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CardContent"], {
                children: isLoadingObjectives ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 text-muted-foreground",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                            className: "h-4 w-4 animate-spin"
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/daily-objectives.tsx",
                            lineNumber: 60,
                            columnNumber: 80
                        }, this),
                        "Loading objectives..."
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/daily-objectives.tsx",
                    lineNumber: 60,
                    columnNumber: 17
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                    className: "space-y-3",
                    children: objectives.map((obj)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                            className: "flex items-start gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>toggleObjective(obj.id),
                                    className: "mt-1 flex-shrink-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", obj.completed ? 'border-primary bg-primary' : 'border-muted-foreground'),
                                        children: obj.completed && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$check$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__Check$3e$__["Check"], {
                                            className: "h-3 w-3 text-primary-foreground"
                                        }, void 0, false, {
                                            fileName: "[project]/frontend/components/daily-objectives.tsx",
                                            lineNumber: 67,
                                            columnNumber: 55
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/frontend/components/daily-objectives.tsx",
                                        lineNumber: 66,
                                        columnNumber: 33
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/daily-objectives.tsx",
                                    lineNumber: 65,
                                    columnNumber: 29
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("flex-1 text-sm text-muted-foreground", obj.completed && "line-through"),
                                    children: obj.description
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/daily-objectives.tsx",
                                    lineNumber: 70,
                                    columnNumber: 29
                                }, this)
                            ]
                        }, obj.id, true, {
                            fileName: "[project]/frontend/components/daily-objectives.tsx",
                            lineNumber: 64,
                            columnNumber: 25
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/frontend/components/daily-objectives.tsx",
                    lineNumber: 62,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/daily-objectives.tsx",
                lineNumber: 58,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/daily-objectives.tsx",
        lineNumber: 52,
        columnNumber: 9
    }, this);
}
}}),

};

//# sourceMappingURL=frontend_c307d19a._.js.map