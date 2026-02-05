(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/frontend/hooks/use-toast.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "reducer": (()=>reducer),
    "toast": (()=>toast),
    "useToast": (()=>useToast)
});
// Inspired by react-hot-toast library
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(memoryState);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "useToast.useEffect": ()=>{
            listeners.push(setState);
            return ({
                "useToast.useEffect": ()=>{
                    const index = listeners.indexOf(setState);
                    if (index > -1) {
                        listeners.splice(index, 1);
                    }
                }
            })["useToast.useEffect"];
        }
    }["useToast.useEffect"], [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
_s(useToast, "SPWE98mLGnlsnNfIwu/IAKTSZtk=");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/AI/lib/utils.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "cn": (()=>cn),
    "formatMessageContent": (()=>formatMessageContent)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
function formatMessageContent(content) {
    // Remove stray newlines that might come from the AI
    let cleanContent = content.replace(/\n/g, " ").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
    // Convert URLs into clickable links with text-primary class
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    cleanContent = cleanContent.replace(urlRegex, (url)=>{
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary">${url}</a>`;
    });
    return cleanContent;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/ui/toast.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Toast": (()=>Toast),
    "ToastAction": (()=>ToastAction),
    "ToastClose": (()=>ToastClose),
    "ToastDescription": (()=>ToastDescription),
    "ToastProvider": (()=>ToastProvider),
    "ToastTitle": (()=>ToastTitle),
    "ToastViewport": (()=>ToastViewport)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
;
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toast.tsx",
        lineNumber: 16,
        columnNumber: 3
    }, this));
_c1 = ToastViewport;
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"].displayName;
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Toast = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = ({ className, variant, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toast.tsx",
        lineNumber: 49,
        columnNumber: 5
    }, this);
});
_c3 = Toast;
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toast.tsx",
        lineNumber: 62,
        columnNumber: 3
    }, this));
_c5 = ToastAction;
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/frontend/components/ui/toast.tsx",
            lineNumber: 86,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toast.tsx",
        lineNumber: 77,
        columnNumber: 3
    }, this));
_c7 = ToastClose;
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toast.tsx",
        lineNumber: 95,
        columnNumber: 3
    }, this));
_c9 = ToastTitle;
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm opacity-90", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/toast.tsx",
        lineNumber: 107,
        columnNumber: 3
    }, this));
_c11 = ToastDescription;
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "ToastViewport$React.forwardRef");
__turbopack_context__.k.register(_c1, "ToastViewport");
__turbopack_context__.k.register(_c2, "Toast$React.forwardRef");
__turbopack_context__.k.register(_c3, "Toast");
__turbopack_context__.k.register(_c4, "ToastAction$React.forwardRef");
__turbopack_context__.k.register(_c5, "ToastAction");
__turbopack_context__.k.register(_c6, "ToastClose$React.forwardRef");
__turbopack_context__.k.register(_c7, "ToastClose");
__turbopack_context__.k.register(_c8, "ToastTitle$React.forwardRef");
__turbopack_context__.k.register(_c9, "ToastTitle");
__turbopack_context__.k.register(_c10, "ToastDescription$React.forwardRef");
__turbopack_context__.k.register(_c11, "ToastDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/ui/toaster.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Toaster": (()=>Toaster)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/toast.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function Toaster() {
    _s();
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastProvider"], {
        children: [
            toasts.map(function({ id, title, description, action, ...props }) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Toast"], {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastTitle"], {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/toaster.tsx",
                                    lineNumber: 22,
                                    columnNumber: 25
                                }, this),
                                description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastDescription"], {
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/ui/toaster.tsx",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/ui/toaster.tsx",
                            lineNumber: 21,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastClose"], {}, void 0, false, {
                            fileName: "[project]/frontend/components/ui/toaster.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/frontend/components/ui/toaster.tsx",
                    lineNumber: 20,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ToastViewport"], {}, void 0, false, {
                fileName: "[project]/frontend/components/ui/toaster.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/ui/toaster.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_s(Toaster, "1YTCnXrq2qRowe0H/LBWLjtXoYc=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = Toaster;
var _c;
__turbopack_context__.k.register(_c, "Toaster");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/ui/dialog.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Dialog": (()=>Dialog),
    "DialogClose": (()=>DialogClose),
    "DialogContent": (()=>DialogContent),
    "DialogDescription": (()=>DialogDescription),
    "DialogFooter": (()=>DialogFooter),
    "DialogHeader": (()=>DialogHeader),
    "DialogOverlay": (()=>DialogOverlay),
    "DialogPortal": (()=>DialogPortal),
    "DialogTitle": (()=>DialogTitle),
    "DialogTrigger": (()=>DialogTrigger)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-dialog/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
const Dialog = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"];
const DialogTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"];
const DialogPortal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"];
const DialogClose = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"];
const DialogOverlay = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Overlay"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/dialog.tsx",
        lineNumber: 21,
        columnNumber: 3
    }, this));
_c = DialogOverlay;
DialogOverlay.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Overlay"].displayName;
const DialogContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c1 = ({ className, children, showCloseButton = true, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogPortal, {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DialogOverlay, {}, void 0, false, {
                fileName: "[project]/frontend/components/ui/dialog.tsx",
                lineNumber: 37,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
                ref: ref,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg", className),
                ...props,
                children: [
                    children,
                    showCloseButton && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Close"], {
                        className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/dialog.tsx",
                                lineNumber: 49,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "sr-only",
                                children: "Close"
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/ui/dialog.tsx",
                                lineNumber: 50,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/ui/dialog.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/ui/dialog.tsx",
                lineNumber: 38,
                columnNumber: 5
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/ui/dialog.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, this));
_c2 = DialogContent;
DialogContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"].displayName;
const DialogHeader = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 text-center sm:text-left", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/dialog.tsx",
        lineNumber: 62,
        columnNumber: 3
    }, this);
_c3 = DialogHeader;
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/dialog.tsx",
        lineNumber: 76,
        columnNumber: 3
    }, this);
_c4 = DialogFooter;
DialogFooter.displayName = "DialogFooter";
const DialogTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c5 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-lg font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/dialog.tsx",
        lineNumber: 90,
        columnNumber: 3
    }, this));
_c6 = DialogTitle;
DialogTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Title"].displayName;
const DialogDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c7 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/dialog.tsx",
        lineNumber: 105,
        columnNumber: 3
    }, this));
_c8 = DialogDescription;
DialogDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$dialog$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Description"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
__turbopack_context__.k.register(_c, "DialogOverlay");
__turbopack_context__.k.register(_c1, "DialogContent$React.forwardRef");
__turbopack_context__.k.register(_c2, "DialogContent");
__turbopack_context__.k.register(_c3, "DialogHeader");
__turbopack_context__.k.register(_c4, "DialogFooter");
__turbopack_context__.k.register(_c5, "DialogTitle$React.forwardRef");
__turbopack_context__.k.register(_c6, "DialogTitle");
__turbopack_context__.k.register(_c7, "DialogDescription$React.forwardRef");
__turbopack_context__.k.register(_c8, "DialogDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/pulse-orb.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "PulseOrb": (()=>PulseOrb)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
'use client';
;
;
function PulseOrb({ state }) {
    // Animation Variants
    const coreVariants = {
        idle: {
            scale: [
                1,
                1.05,
                1
            ],
            opacity: 0.8,
            boxShadow: "0px 0px 20px 5px rgba(230, 195, 106, 0.3)",
            transition: {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
            }
        },
        listening: {
            scale: [
                1,
                1.25,
                0.95,
                1.1,
                1
            ],
            opacity: 1,
            boxShadow: "0px 0px 40px 10px rgba(230, 195, 106, 0.6)",
            transition: {
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
            }
        },
        processing: {
            scale: 0.9,
            rotate: 360,
            borderRadius: [
                "50%",
                "40%",
                "50%"
            ],
            boxShadow: "0px 0px 30px 5px rgba(230, 195, 106, 0.5)",
            transition: {
                rotate: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                },
                borderRadius: {
                    duration: 1,
                    repeat: Infinity
                }
            }
        },
        speaking: {
            scale: [
                1,
                1.15,
                1
            ],
            opacity: 1,
            boxShadow: [
                "0px 0px 20px 2px rgba(230, 195, 106, 0.4)",
                "0px 0px 60px 20px rgba(230, 195, 106, 0.2)",
                "0px 0px 20px 2px rgba(230, 195, 106, 0.4)"
            ],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        },
        error: {
            scale: 1,
            backgroundColor: "#ef4444",
            boxShadow: "0px 0px 20px 5px rgba(239, 68, 68, 0.5)"
        }
    };
    const ringVariants = {
        idle: {
            opacity: 0
        },
        listening: {
            scale: [
                1,
                2
            ],
            opacity: [
                0.5,
                0
            ],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut"
            }
        },
        processing: {
            opacity: 0
        },
        speaking: {
            scale: [
                1,
                1.5
            ],
            opacity: [
                0.3,
                0
            ],
            transition: {
                duration: 2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.2
            }
        },
        error: {
            opacity: 0
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative flex items-center justify-center w-64 h-64",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute inset-0 bg-radial-gradient from-gold/10 to-transparent opacity-50 blur-3xl"
            }, void 0, false, {
                fileName: "[project]/frontend/components/pulse-orb.tsx",
                lineNumber: 71,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "absolute w-full h-full rounded-full border border-[rgba(230,195,106,0.3)]",
                variants: ringVariants,
                animate: state,
                initial: "idle"
            }, void 0, false, {
                fileName: "[project]/frontend/components/pulse-orb.tsx",
                lineNumber: 74,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                className: "w-32 h-32 rounded-full bg-[#E6C36A] relative z-10",
                variants: coreVariants,
                animate: state,
                initial: "idle",
                // Add a subtle inner gradient or highlight
                style: {
                    background: "radial-gradient(circle at 30% 30%, #F4DFA9, #E6C36A, #B89542)"
                }
            }, void 0, false, {
                fileName: "[project]/frontend/components/pulse-orb.tsx",
                lineNumber: 82,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/pulse-orb.tsx",
        lineNumber: 69,
        columnNumber: 9
    }, this);
}
_c = PulseOrb;
var _c;
__turbopack_context__.k.register(_c, "PulseOrb");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/lib/mock-auth.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// This module is responsible for fetching a mock authentication token during development.
// We store the token in a singleton pattern to avoid re-fetching it on every API call.
__turbopack_context__.s({
    "getMockAuthToken": (()=>getMockAuthToken)
});
let mockAuthToken = null;
/**
 * Fetches a mock JWT from our new API endpoint.
 * This avoids the security risks and technical problems of generating tokens on the client-side.
 */ async function fetchMockToken() {
    try {
        // We make a request to our new, server-side endpoint.
        const response = await fetch('/api/auth/mock-token');
        if (!response.ok) {
            console.error(`[MockAuth] Failed to fetch mock token: HTTP error! status: ${response.status}`);
            throw new Error(`Failed to fetch mock token: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('[MockAuth] Successfully fetched mock token.');
        return data.token;
    } catch (error) {
        console.error('[MockAuth] Error fetching mock auth token:', error);
        // If we can't get a token, we return an empty string. This will cause API
        // calls to fail, which is better than letting the app hang.
        return '';
    }
}
async function getMockAuthToken() {
    if (mockAuthToken === null) {
        mockAuthToken = await fetchMockToken();
    }
    return mockAuthToken;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/app/data:49fc10 [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"7ffb0850d8356f1302247d1a1a0765dd4d440d4972":"getAssistantResponse"},"frontend/app/actions.ts",""] */ __turbopack_context__.s({
    "getAssistantResponse": (()=>getAssistantResponse)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var getAssistantResponse = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("7ffb0850d8356f1302247d1a1a0765dd4d440d4972", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "getAssistantResponse"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHNlcnZlcic7XHJcblxyXG5pbXBvcnQgeyBlbW90aW9uYWxBSUNvcGlsb3QgfSBmcm9tICdAL2FpL2Zsb3dzL2Vtb3Rpb25hbC1haS1jb3BpbG90JztcclxuaW1wb3J0IHsgcGVyc29uYWxpemVkT2JqZWN0aXZlcywgUGVyc29uYWxpemVkT2JqZWN0aXZlc0lucHV0IH0gZnJvbSAnQC9haS9mbG93cy9wZXJzb25hbGl6ZS1kYWlseS1vYmplY3RpdmVzJztcclxuaW1wb3J0IHsgeW91dHViZVNlYXJjaEZsb3cgfSBmcm9tICdAL2FpL2Zsb3dzL3lvdXR1YmUtc2VhcmNoLWZsb3cnO1xyXG5pbXBvcnQgeyBydW5GbG93IH0gZnJvbSAnQGdlbmtpdC1haS9mbG93JztcclxuaW1wb3J0IHR5cGUgeyBDb252ZXJzYXRpb25TdGF0ZSwgTWVzc2FnZSB9IGZyb20gJ0AvbGliL3R5cGVzJztcclxuaW1wb3J0IHByaXNtYSBmcm9tICdAL2xpYi9wcmlzbWEnO1xyXG5pbXBvcnQgeyBjb29raWVzIH0gZnJvbSAnbmV4dC9oZWFkZXJzJztcclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgdG8gc2F2ZSBtZXNzYWdlIHRvIERCIChtaW1pY3MgYmFja2VuZCBsb2dpYylcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHNhdmVNZXNzYWdlVG9EYihzZXNzaW9uSWQ6IHN0cmluZywgcm9sZTogJ3VzZXInIHwgJ21vZGVsJywgY29udGVudDogc3RyaW5nKSB7XHJcbiAgdHJ5IHtcclxuICAgIGlmICghc2Vzc2lvbklkKSByZXR1cm47XHJcblxyXG4gICAgY29uc3Qgc2Vzc2lvbkV4aXN0cyA9IGF3YWl0IHByaXNtYS5jaGF0U2Vzc2lvbi5maW5kVW5pcXVlKHtcclxuICAgICAgICB3aGVyZTogeyBpZDogc2Vzc2lvbklkIH0sXHJcbiAgICAgICAgc2VsZWN0OiB7IGlkOiB0cnVlIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghc2Vzc2lvbkV4aXN0cykge1xyXG4gICAgICAgIHJldHVybjsgXHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgY291bnQgPSBhd2FpdCBwcmlzbWEuY2hhdE1lc3NhZ2UuY291bnQoeyB3aGVyZTogeyBzZXNzaW9uSWQgfSB9KTtcclxuICAgIGF3YWl0IHByaXNtYS5jaGF0TWVzc2FnZS5jcmVhdGUoe1xyXG4gICAgICBkYXRhOiB7XHJcbiAgICAgICAgc2Vzc2lvbklkLFxyXG4gICAgICAgIHJvbGUsXHJcbiAgICAgICAgY29udGVudCxcclxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXHJcbiAgICAgICAgbWVzc2FnZU51bWJlcjogY291bnQgKyAxLFxyXG4gICAgICB9LFxyXG4gICAgfSk7XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIC8vIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNhdmluZyBtZXNzYWdlIHRvIERCOicsIGVycm9yKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBIZWxwZXIgdG8gdXBkYXRlIHNlc3Npb24gc3RhdGUgYW5kIHRpdGxlXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVTZXNzaW9uU3RhdGUoc2Vzc2lvbklkOiBzdHJpbmcsIHN0YXRlOiBDb252ZXJzYXRpb25TdGF0ZSwgdG9waWM/OiBzdHJpbmcsIHRpdGxlPzogc3RyaW5nKSB7XHJcbiAgaWYgKCFzZXNzaW9uSWQpIHJldHVybjtcclxuICBcclxuICAvLyDwn5SNIExPR0dJTkc6IENoZWNraW5nIHdoYXQgd2UgYXJlIHRyeWluZyB0byBzYXZlXHJcbiAgY29uc29sZS5sb2coYFtBQ1RJT04gTE9HXSBBdHRlbXB0aW5nIERCIFVwZGF0ZS4gSUQ6ICR7c2Vzc2lvbklkfSwgVGl0bGU6IFwiJHt0aXRsZX1cImApO1xyXG5cclxuICBjb25zdCBkYXRhOiBhbnkgPSB7IHVwZGF0ZWRBdDogbmV3IERhdGUoKSwgbWV0YWRhdGE6IHN0YXRlIH07XHJcbiAgXHJcbiAgLy8g4pyFIFVQREFURSBUSVRMRSBJRiBQUk9WSURFRFxyXG4gIGlmICh0aXRsZSAmJiB0aXRsZSAhPT0gXCJOZXcgQ2hhdFwiKSB7XHJcbiAgICAgIGRhdGEudG9waWMgPSB0aXRsZTsgLy8gTWFwICd0aXRsZScgdG8gJ3RvcGljJyBjb2x1bW5cclxuICB9XHJcbiAgXHJcbiAgLy8gVVBEQVRFIElOVEVSTkFMIFRPUElDIChJZiBzZXBhcmF0ZSBmcm9tIHRpdGxlKVxyXG4gIGlmICh0b3BpYyAmJiAhdGl0bGUpIHtcclxuICAgICAgZGF0YS50b3BpYyA9IHRvcGljO1xyXG4gIH1cclxuICBcclxuICBhd2FpdCBwcmlzbWEuY2hhdFNlc3Npb24udXBkYXRlKHtcclxuICAgIHdoZXJlOiB7IGlkOiBzZXNzaW9uSWQgfSxcclxuICAgIGRhdGEsXHJcbiAgfSk7XHJcbn1cclxuXHJcbi8vIEZFVENIIE1FTU9SWSBIRUxQRVJcclxuYXN5bmMgZnVuY3Rpb24gZmV0Y2hTdHVkZW50TWVtb3J5KCkge1xyXG4gIHRyeSB7XHJcbiAgICByZXR1cm4geyBwcm9ncmVzczogW10sIG1pc3Rha2VzOiBbXSB9O1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHJldHVybiB7IHByb2dyZXNzOiBbXSwgbWlzdGFrZXM6IFtdIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QXNzaXN0YW50UmVzcG9uc2UoXHJcbiAgc2Vzc2lvbklkOiBzdHJpbmcsXHJcbiAgbWVzc2FnZTogc3RyaW5nLFxyXG4gIGNoYXRIaXN0b3J5OiBNZXNzYWdlW10sXHJcbiAgY3VycmVudFN0YXRlOiBDb252ZXJzYXRpb25TdGF0ZSxcclxuICBmaWxlRGF0YUJhc2U2NDogeyB0eXBlOiBzdHJpbmc7IGJhc2U2NDogc3RyaW5nIH0gfCB1bmRlZmluZWQsXHJcbiAgZm9yY2VXZWJTZWFyY2g6IGJvb2xlYW4sXHJcbiAgaW5jbHVkZVZpZGVvczogYm9vbGVhbixcclxuICBwcmVmZXJlbmNlczoge1xyXG4gICAgbmFtZT86IHN0cmluZztcclxuICAgIGdyYWRlTGV2ZWw/OiAnUHJpbWFyeScgfCAnTG93ZXJTZWNvbmRhcnknIHwgJ1VwcGVyU2Vjb25kYXJ5JztcclxuICAgIHByZWZlcnJlZExhbmd1YWdlPzogJ2VuZ2xpc2gnIHwgJ3N3YWhpbGknIHwgJ2FyYWJpYycgfCAnZW5nbGlzaF9zdyc7XHJcbiAgICBpbnRlcmVzdHM/OiBzdHJpbmdbXTtcclxuICB9LFxyXG4gIHN0dWRlbnRNZW1vcnk6IHtcclxuICAgIHByb2dyZXNzOiBhbnlbXTtcclxuICAgIG1pc3Rha2VzOiBhbnlbXTtcclxuICB9XHJcbikge1xyXG4gIHRyeSB7XHJcbiAgICAvLyAxLiBTYXZlIFVzZXIgTWVzc2FnZSAoU2FmZWx5KVxyXG4gICAgaWYgKHNlc3Npb25JZCkge1xyXG4gICAgICAgIGF3YWl0IHNhdmVNZXNzYWdlVG9EYihzZXNzaW9uSWQsICd1c2VyJywgbWVzc2FnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g4pyFIEZFVENIIENVUlJFTlQgVElUTEUgVE8gUEFTUyBUTyBBSVxyXG4gICAgLy8gVGhpcyBhbGxvd3MgdGhlIEFJIHRvIGtub3cgaWYgaXQgbmVlZHMgdG8gZ2VuZXJhdGUgYSB0aXRsZSAoaWYgY3VycmVudCBpcyAnTmV3IENoYXQnKVxyXG4gICAgbGV0IGN1cnJlbnRUaXRsZSA9ICdOZXcgQ2hhdCc7XHJcbiAgICBpZiAoc2Vzc2lvbklkKSB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudFNlc3Npb24gPSBhd2FpdCBwcmlzbWEuY2hhdFNlc3Npb24uZmluZFVuaXF1ZSh7XHJcbiAgICAgICAgICAgICAgICB3aGVyZTogeyBpZDogc2Vzc2lvbklkIH0sXHJcbiAgICAgICAgICAgICAgICBzZWxlY3Q6IHsgdG9waWM6IHRydWUgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTZXNzaW9uPy50b3BpYykge1xyXG4gICAgICAgICAgICAgICAgY3VycmVudFRpdGxlID0gY3VycmVudFNlc3Npb24udG9waWM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIElnbm9yZSBEQiByZWFkIGVycm9yLCBkZWZhdWx0IHRvIE5ldyBDaGF0XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIDIuIFJ1biBBSVxyXG4gICAgY29uc29sZS5sb2coXCJbQUNUSU9OIExPR10gQ2FsbGluZyBFbW90aW9uYWwgQUkuLi5cIik7XHJcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGVtb3Rpb25hbEFJQ29waWxvdCh7XHJcbiAgICAgIHRleHQ6IG1lc3NhZ2UsXHJcbiAgICAgIGNoYXRIaXN0b3J5OiBjaGF0SGlzdG9yeSxcclxuICAgICAgc3RhdGU6IGN1cnJlbnRTdGF0ZSxcclxuICAgICAgcHJlZmVyZW5jZXM6IHByZWZlcmVuY2VzLFxyXG4gICAgICBmaWxlRGF0YTogZmlsZURhdGFCYXNlNjQsXHJcbiAgICAgIGZvcmNlV2ViU2VhcmNoLFxyXG4gICAgICBpbmNsdWRlVmlkZW9zLFxyXG4gICAgICBtZW1vcnk6IHN0dWRlbnRNZW1vcnksXHJcbiAgICAgIGN1cnJlbnRUaXRsZTogY3VycmVudFRpdGxlLFxyXG4gICAgICBzdHVkZW50UHJvZmlsZToge1xyXG4gICAgICAgIG5hbWU6IHByZWZlcmVuY2VzLm5hbWUgfHwgJ1N0dWRlbnQnLCAvLyBFbnN1cmUgbmFtZSBpcyBwYXNzZWRcclxuICAgICAgICBncmFkZUxldmVsOiBwcmVmZXJlbmNlcy5ncmFkZUxldmVsIHx8ICdQcmltYXJ5JyAvLyBFbnN1cmUgZ3JhZGUgaXMgcGFzc2VkXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnNvbGUubG9nKGBbQUNUSU9OIExPR10gQUkgRmluaXNoZWQuIFN1Z2dlc3RlZCBUaXRsZTogXCIke3Jlc3BvbnNlLnN1Z2dlc3RlZFRpdGxlfVwiYCk7XHJcblxyXG4gICAgLy8gMy4gU2F2ZSBBSSBSZXNwb25zZSAmIFRyeSBVcGRhdGUgVGl0bGVcclxuICAgIGlmIChzZXNzaW9uSWQpIHtcclxuICAgICAgICBhd2FpdCBzYXZlTWVzc2FnZVRvRGIoc2Vzc2lvbklkLCAnbW9kZWwnLCByZXNwb25zZS5wcm9jZXNzZWRUZXh0KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyDwn5uh77iPIENSSVRJQ0FMIEZJWDogVFJZL0NBVENIIEFST1VORCBEQiBVUERBVEVcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB1cGRhdGVTZXNzaW9uU3RhdGUoXHJcbiAgICAgICAgICAgICAgICBzZXNzaW9uSWQsIFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc3RhdGUsIFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2UudG9waWMsIFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc3VnZ2VzdGVkVGl0bGUgXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBjYXRjaCAoZGJFcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCLimqDvuI8gW0FDVElPTiBMT0ddIERCIFdyaXRlIEZhaWxlZCAoUkxTL0F1dGgpLiBSZXR1cm5pbmcgdGl0bGUgdG8gQ2xpZW50IGZvciBmYWxsYmFjayBzYXZlLlwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgcHJvY2Vzc2VkVGV4dDogcmVzcG9uc2UucHJvY2Vzc2VkVGV4dCxcclxuICAgICAgdmlkZW9EYXRhOiByZXNwb25zZS52aWRlb0RhdGEgPz8gdW5kZWZpbmVkLFxyXG4gICAgICBzdGF0ZTogcmVzcG9uc2Uuc3RhdGUsXHJcbiAgICAgIC8vIOKchSBWSVRBTCBGSVg6IFBhc3Mgc3VnZ2VzdGVkVGl0bGUgYXMgJ3RvcGljJyBzbyBmcm9udGVuZCBkZXRlY3RzIGl0XHJcbiAgICAgIHRvcGljOiByZXNwb25zZS5zdWdnZXN0ZWRUaXRsZSB8fCByZXNwb25zZS50b3BpYyxcclxuICAgICAgc3VnZ2VzdGVkVGl0bGU6IHJlc3BvbnNlLnN1Z2dlc3RlZFRpdGxlIFxyXG4gICAgfTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tTRVJWRVIgQUNUSU9OIEZBVEFMIEVSUk9SXScsIGVycik7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBwcm9jZXNzZWRUZXh0OiAnSSBhbSBzb3JyeSwgYnV0IHNvbWV0aGluZyB3ZW50IHdyb25nIHdoaWxlIHByb2Nlc3NpbmcgdGhhdC4gQ291bGQgeW91IHRyeSBhZ2Fpbj8nLFxyXG4gICAgICB2aWRlb0RhdGE6IHVuZGVmaW5lZCxcclxuICAgICAgc3RhdGU6IGN1cnJlbnRTdGF0ZSxcclxuICAgICAgdG9waWM6IHVuZGVmaW5lZCxcclxuICAgIH07XHJcbiAgfVxyXG59XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0RGFpbHlPYmplY3RpdmVzKFxyXG4gIHN0dWRlbnRQZXJmb3JtYW5jZTogc3RyaW5nLFxyXG4gIGN1cnJpY3VsdW06IHN0cmluZyxcclxuICBsb2dnZWRNaXNjb25jZXB0aW9uczogc3RyaW5nXHJcbikge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBvYmplY3RpdmVzSW5wdXQ6IFBlcnNvbmFsaXplZE9iamVjdGl2ZXNJbnB1dCA9IHtcclxuICAgICAgc3R1ZGVudFBlcmZvcm1hbmNlLFxyXG4gICAgICBjdXJyaWN1bHVtLFxyXG4gICAgICBsb2dnZWRNaXNjb25jZXB0aW9ucyxcclxuICAgIH07XHJcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwZXJzb25hbGl6ZWRPYmplY3RpdmVzKG9iamVjdGl2ZXNJbnB1dCk7XHJcbiAgICByZXR1cm4gcmVzdWx0LmRhaWx5T2JqZWN0aXZlcztcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ1tTRVJWRVIgQUNUSU9OIEJSSURHRSBFUlJPUiAtIE9iamVjdGl2ZXNdJywgZXJyKTtcclxuICAgIHJldHVybiBbJ1JldmlldyB0b2RheVxcJ3Mga2V5IGNvbmNlcHRzLicsICdQcmFjdGljZSBvbmUgY29yZSBwcm9ibGVtLiddO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlYXJjaFlvdVR1YmUocXVlcnk6IHN0cmluZykge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCByZXN1bHRzID0gYXdhaXQgcnVuRmxvdyh5b3V0dWJlU2VhcmNoRmxvdywgeyBxdWVyeSB9KTtcclxuICAgIHJldHVybiByZXN1bHRzO1xyXG4gIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICBjb25zb2xlLmVycm9yKCdbU0VSVkVSIEFDVElPTiBCUklER0UgRVJST1IgLSBZb3VUdWJlXScsIGVycm9yKTtcclxuICAgIHJldHVybiBbXTtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIHsgQ29udmVyc2F0aW9uU3RhdGUsIE1lc3NhZ2UgfTsiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InFTQTZFc0IifQ==
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Button": (()=>Button),
    "buttonVariants": (()=>buttonVariants)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-slot/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const buttonVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            link: "text-primary underline-offset-4 hover:underline"
        },
        size: {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, variant, size, asChild = false, ...props }, ref)=>{
    const Comp = asChild ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$slot$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Slot"] : "button";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Comp, {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(buttonVariants({
            variant,
            size,
            className
        })),
        ref: ref,
        ...props
    }, void 0, false, {
        fileName: "[project]/frontend/components/ui/button.tsx",
        lineNumber: 46,
        columnNumber: 7
    }, this);
});
_c1 = Button;
Button.displayName = "Button";
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Button$React.forwardRef");
__turbopack_context__.k.register(_c1, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/voice-concierge.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "VoiceConcierge": (()=>VoiceConcierge)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/mic.js [app-client] (ecmascript) <export default as Mic>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/square.js [app-client] (ecmascript) <export default as Square>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-2.js [app-client] (ecmascript) <export default as Volume2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/volume-x.js [app-client] (ecmascript) <export default as VolumeX>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$pulse$2d$orb$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/pulse-orb.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$mock$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/lib/mock-auth.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$data$3a$49fc10__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/frontend/app/data:49fc10 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/AI/lib/utils.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
;
function VoiceConcierge({ onClose }) {
    _s();
    const [state, setState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('idle');
    const [transcript, setTranscript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [aiResponseText, setAiResponseText] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [timer, setTimer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [isMuted, setIsMuted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const mediaRecorderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const audioRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const timerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const messagesRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]); // Keep local history for context via Ref
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    // Cleanup on unmount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "VoiceConcierge.useEffect": ()=>{
            return ({
                "VoiceConcierge.useEffect": ()=>{
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current = null;
                    }
                }
            })["VoiceConcierge.useEffect"];
        }
    }["VoiceConcierge.useEffect"], []);
    const startTimer = ()=>{
        setTimer(0);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(()=>{
            setTimer((prev)=>prev + 1);
        }, 1000);
    };
    const stopTimer = ()=>{
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };
    const formatTime = (seconds)=>{
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    const handleStartListening = async ()=>{
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            const audioChunks = [];
            mediaRecorder.ondataavailable = (event)=>{
                if (event.data.size > 0) audioChunks.push(event.data);
            };
            mediaRecorder.onstop = async ()=>{
                const audioBlob = new Blob(audioChunks, {
                    type: 'audio/webm'
                });
                processAudio(audioBlob);
                stream.getTracks().forEach((track)=>track.stop());
            };
            mediaRecorder.start();
            setState('listening');
            startTimer();
        } catch (error) {
            console.error('Mic access denied:', error);
            setState('error');
            setAiResponseText("Please enable microphone access.");
        }
    };
    const handleStopListening = ()=>{
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            stopTimer();
            setState('processing');
        }
    };
    const processAudio = async (audioBlob)=>{
        try {
            // 1. Get Token (Mock Auth Fallback)
            let token = localStorage.getItem('token');
            if (!token) {
                try {
                    token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$lib$2f$mock$2d$auth$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMockAuthToken"])();
                } catch (e) {
                    console.error('Failed to get mock token', e);
                }
            }
            if (!token) throw new Error("Authentication failed");
            // 2. STT
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            const sttRes = await fetch('/api/copilot/stt', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!sttRes.ok) throw new Error("Transcription failed");
            const sttData = await sttRes.json();
            const userText = sttData.text;
            setTranscript(userText); // Preview what user said
            if (!userText) {
                setState('idle'); // No speech detected
                return;
            }
            // 3. AI Processing
            // Construct message object
            const userMessage = {
                id: Date.now().toString(),
                role: 'user',
                content: userText,
                timestamp: new Date()
            };
            const defaultState = {
                researchModeActive: false,
                lastSearchTopic: [],
                awaitingPracticeQuestionInvitationResponse: false,
                awaitingPracticeQuestionAnswer: false,
                validationAttemptCount: 0,
                sensitiveContentDetected: false,
                videoSuggested: false,
                usedExamples: []
            };
            // Call Server Action with correct arguments
            const response = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$app$2f$data$3a$49fc10__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getAssistantResponse"])('concierge_session', userText, messagesRef.current, defaultState, undefined, false, false, {
                name: 'Guest'
            }, {
                progress: [],
                mistakes: []
            });
            const aiText = response.processedText || "I'm sorry, I couldn't understand that.";
            setAiResponseText(aiText);
            // Update History
            messagesRef.current.push(userMessage);
            messagesRef.current.push({
                id: (Date.now() + 1).toString(),
                role: 'model',
                content: aiText,
                timestamp: new Date()
            });
            // 4. TTS and Speaking
            await playTTS(aiText, token);
        } catch (error) {
            console.error("Processing error:", error);
            setState('error');
            setAiResponseText("Something went wrong. Please try again.");
        }
    };
    const playTTS = async (text, token)=>{
        try {
            const ttsRes = await fetch('/api/copilot/tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text
                })
            });
            if (!ttsRes.ok) throw new Error("TTS failed");
            const audioBlob = await ttsRes.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            // Mute check
            audio.muted = isMuted;
            audio.onended = ()=>{
                // Return to idle
                setState('idle');
            };
            setState('speaking');
            await audio.play();
        } catch (e) {
            console.error("TTS Error", e);
            setState('idle');
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col items-center justify-between w-full h-full p-8 text-center bg-[#0B1A2A] text-white",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center min-h-[60px] mt-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-3xl font-playfair transition-all duration-500", state === 'processing' ? 'animate-pulse text-[#E6C36A]' : 'text-white'),
                        children: [
                            state === 'idle' && "How can I help you today?",
                            state === 'listening' && "Listening...",
                            state === 'processing' && "Thinking...",
                            state === 'speaking' && "Speaking...",
                            state === 'error' && "Error"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/voice-concierge.tsx",
                        lineNumber: 230,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-base text-gray-400 font-ptsans max-w-lg line-clamp-2",
                        children: [
                            state === 'idle' && "Ask about bookings, prices, or loyalty rewards.",
                            state === 'listening' && formatTime(timer),
                            (state === 'processing' || state === 'speaking') && transcript ? `"${transcript}"` : "",
                            state === 'error' && aiResponseText
                        ]
                    }, void 0, true, {
                        fileName: "[project]/frontend/components/voice-concierge.tsx",
                        lineNumber: 241,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/voice-concierge.tsx",
                lineNumber: 229,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center w-full min-h-[300px]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$pulse$2d$orb$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PulseOrb"], {
                    state: state
                }, void 0, false, {
                    fileName: "[project]/frontend/components/voice-concierge.tsx",
                    lineNumber: 251,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/voice-concierge.tsx",
                lineNumber: 250,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex-1 flex items-center justify-center w-full max-h-[150px] px-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$components$2f$AnimatePresence$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AnimatePresence"], {
                    children: state === 'speaking' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 20
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        exit: {
                            opacity: 0,
                            y: 10
                        },
                        className: "p-6 bg-white/5 rounded-2xl border border-[#E6C36A]/20 backdrop-blur-md max-w-2xl w-full shadow-lg",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-[#E6C36A] text-lg font-playfair leading-relaxed line-clamp-3",
                            children: aiResponseText
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/voice-concierge.tsx",
                            lineNumber: 264,
                            columnNumber: 29
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/voice-concierge.tsx",
                        lineNumber: 258,
                        columnNumber: 25
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/frontend/components/voice-concierge.tsx",
                    lineNumber: 256,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/frontend/components/voice-concierge.tsx",
                lineNumber: 255,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-8 mb-8 mt-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        size: "icon",
                        className: "rounded-full w-12 h-12 text-white/50 hover:text-white hover:bg-white/10",
                        onClick: ()=>{
                            setIsMuted(!isMuted);
                            if (audioRef.current) audioRef.current.muted = !isMuted;
                        },
                        children: isMuted ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__VolumeX$3e$__["VolumeX"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/voice-concierge.tsx",
                            lineNumber: 285,
                            columnNumber: 32
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$volume$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Volume2$3e$__["Volume2"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/voice-concierge.tsx",
                            lineNumber: 285,
                            columnNumber: 56
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/voice-concierge.tsx",
                        lineNumber: 276,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        size: "lg",
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$AI$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("h-20 w-20 rounded-full shadow-[0_0_40px_-5px_rgba(230,195,106,0.5)] transition-all duration-300 scale-100 hover:scale-105 active:scale-95", state === 'listening' ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_40px_-5px_rgba(239,68,68,0.5)]" // Stop
                         : "bg-[#E6C36A] hover:bg-[#D4B055] text-[#0B1A2A]" // Mic/Start
                        ),
                        onClick: state === 'listening' ? handleStopListening : handleStartListening,
                        disabled: state === 'processing',
                        children: state === 'listening' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$square$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Square$3e$__["Square"], {
                            className: "fill-current",
                            size: 32
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/voice-concierge.tsx",
                            lineNumber: 301,
                            columnNumber: 25
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$mic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Mic$3e$__["Mic"], {
                            size: 36
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/voice-concierge.tsx",
                            lineNumber: 303,
                            columnNumber: 25
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/voice-concierge.tsx",
                        lineNumber: 289,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        variant: "ghost",
                        size: "icon",
                        className: "rounded-full w-12 h-12 text-white/50 hover:text-white hover:bg-white/10",
                        onClick: onClose,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                            size: 24
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/voice-concierge.tsx",
                            lineNumber: 314,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/frontend/components/voice-concierge.tsx",
                        lineNumber: 308,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/frontend/components/voice-concierge.tsx",
                lineNumber: 273,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/frontend/components/voice-concierge.tsx",
        lineNumber: 226,
        columnNumber: 9
    }, this);
}
_s(VoiceConcierge, "EZFgFx6CkX2YyjjzGr/9L+2oC2A=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = VoiceConcierge;
var _c;
__turbopack_context__.k.register(_c, "VoiceConcierge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/components/steadfast-copilot.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "SteadfastCopilot": (()=>SteadfastCopilot)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/ui/dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$voice$2d$concierge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/frontend/components/voice-concierge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
'use client';
;
;
;
;
function SteadfastCopilot({ isOpen, onOpenChange }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dialog"], {
        open: isOpen,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
            className: "max-w-[1000px] w-[95vw] h-[80vh] min-h-[600px] p-0 gap-0 bg-[#0B1A2A] border-[#E6C36A]/20 text-white overflow-hidden shadow-2xl shadow-black/80 sm:rounded-[2rem] focus:outline-none",
            showCloseButton: false,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 pointer-events-none",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-3 pointer-events-auto",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-2 h-2 rounded-full bg-[#E6C36A] shadow-[0_0_15px_#E6C36A] animate-pulse"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                                    lineNumber: 26,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "font-playfair text-xl tracking-wide text-white drop-shadow-md",
                                    children: "Tarz Elite Concierge"
                                }, void 0, false, {
                                    fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                                    lineNumber: 27,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onOpenChange(false),
                            className: "p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all pointer-events-auto backdrop-blur-sm",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                size: 20
                            }, void 0, false, {
                                fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                                lineNumber: 37,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                    lineNumber: 21,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full h-full relative",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-gold/5 rounded-full blur-[80px] pointer-events-none"
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$frontend$2f$components$2f$voice$2d$concierge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VoiceConcierge"], {
                            onClose: ()=>onOpenChange(false)
                        }, void 0, false, {
                            fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/frontend/components/steadfast-copilot.tsx",
                    lineNumber: 42,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/frontend/components/steadfast-copilot.tsx",
            lineNumber: 16,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/frontend/components/steadfast-copilot.tsx",
        lineNumber: 15,
        columnNumber: 5
    }, this);
}
_c = SteadfastCopilot;
var _c;
__turbopack_context__.k.register(_c, "SteadfastCopilot");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/frontend/contexts/UserProfileContext.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "UserProfileProvider": (()=>UserProfileProvider),
    "useUserProfile": (()=>useUserProfile)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
// Create the context
const UserProfileContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const UserProfileProvider = ({ children })=>{
    _s();
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // This function is generic and will work correctly with the updated UserProfile interface.
    const updateProfile = (updates)=>{
        setProfile((prev)=>{
            const newProfile = prev ? {
                ...prev,
                ...updates
            } : {
                ...updates
            };
            console.log("UserProfileContext: Profile updated", newProfile);
            return newProfile;
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(UserProfileContext.Provider, {
        value: {
            profile,
            setProfile,
            updateProfile
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/frontend/contexts/UserProfileContext.tsx",
        lineNumber: 39,
        columnNumber: 5
    }, this);
};
_s(UserProfileProvider, "ecDzm0e6Ar4IfQvn/Pn6dcQdqwE=");
_c = UserProfileProvider;
const useUserProfile = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(UserProfileContext);
    if (context === undefined) {
        throw new Error('useUserProfile must be used within a UserProfileProvider');
    }
    return context;
};
_s1(useUserProfile, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "UserProfileProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=_09ba4eaf._.js.map