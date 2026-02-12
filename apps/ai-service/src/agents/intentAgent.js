"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAllocationIntent = extractAllocationIntent;
var geminiClient_1 = require("../clients/geminiClient");
function extractAllocationIntent(userMessage_1) {
    return __awaiter(this, arguments, void 0, function (userMessage, conversationHistory) {
        var historyContext, prompt, raw, jsonStr, firstBrace, lastBrace, parsed;
        if (conversationHistory === void 0) { conversationHistory = []; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    historyContext = conversationHistory
                        .map(function (m) { return "".concat(m.role.toUpperCase(), ": ").concat(m.content); })
                        .join('\n');
                    prompt = "\nYou are an expert AI intent extractor for a resource allocation system.\n\nYour task is to analyze the User Message and extract the structured intent.\n\nRules:\n- You are NOT allocating employees.\n- You are ONLY extracting intent.\n- Do NOT suggest names.\n- Do NOT explain.\n- Do NOT hallucinate.\n- Output ONLY valid JSON.\n- If identifying a replacement target (e.g. \"Replace Bob\"), put \"Bob\" in targetEmployeeName.\n- **CONTEXT MATTERS:** Look at the conversation history. If the user says \"add one more\", check previous messages to know WHAT to add.\n- If the user uses words like: \"more\", \"another\", \"additional\", \"one more\", Set \"incremental\": true.\n- If the user asks YOU to decide the number (e.g., \"decide count\", \"as needed\", \"appropriate number\", \"suggest count\"), set \"autoSuggestCount\": true.\n\nDistinguish carefully:\n- \"Create\", \"New\", \"Generate\", \"I need team for...\" -> CREATE_ALLOCATION\n- \"Add\", \"Append\", \"Include more\", \"Also need...\" -> ADD_EMPLOYEES\n- \"Replace\", \"Swap\", \"Change\", \"Remove X and add Y\" -> REPLACE_EMPLOYEE\n- If the user says \"Add...\" but it seems like a new request, still prefer ADD_EMPLOYEES.\n- **Micro-Instruction**: If the user asks for multiple distinct roles/counts (e.g., \"Add 1 frontend and 2 backend\"):\n  - Extract them into the \"roles\" array.\n  - Each role must have its **OWN** count.\n  - Do NOT merge counts across roles.\n  - **Do NOT populate \"role\" or \"employeeCount\" fields in this case** (leave them null).\n\n\nIntent Schema:\n{\n  \"intentType\": \"CREATE_ALLOCATION\" | \"ADD_EMPLOYEES\" | \"REPLACE_EMPLOYEE\" | \"MODIFY_CONSTRAINTS\" | \"ASK_EXPLANATION\",\n  \"role\": string | string[] | null,\n  \"skills\": string[] | null,\n  \"experienceLevel\": \"JUNIOR\" | \"MID\" | \"SENIOR\" | null,\n  \"employeeCount\": number | null,\n  \"targetEmployeeName\": string | null,\n  \"constraints\": {\n    \"minAvailabilityPercent\": number | null\n  } | null,\n  \"roles\": [\n    {\n      \"roleName\": string,\n      \"count\": number\n    }\n  ] | null,\n  \"incremental\": boolean | null,\n  \"autoSuggestCount\": boolean | null\n}\n\nConversation History:\n".concat(historyContext, "\n\nUser Message: \"").concat(userMessage, "\"\n");
                    return [4 /*yield*/, (0, geminiClient_1.callGemini)(prompt)];
                case 1:
                    raw = _a.sent();
                    try {
                        jsonStr = raw;
                        firstBrace = raw.indexOf('{');
                        lastBrace = raw.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace !== -1) {
                            jsonStr = raw.substring(firstBrace, lastBrace + 1);
                        }
                        parsed = JSON.parse(jsonStr);
                        // Normalize and safe return
                        return [2 /*return*/, {
                                intentType: parsed.intentType || 'ASK_EXPLANATION',
                                role: parsed.role || null,
                                skills: Array.isArray(parsed.skills) ? parsed.skills : null,
                                experienceLevel: parsed.experienceLevel || null,
                                employeeCount: typeof parsed.employeeCount === 'number' ? parsed.employeeCount : null,
                                targetEmployeeName: parsed.targetEmployeeName || null,
                                constraints: parsed.constraints || null,
                                roles: Array.isArray(parsed.roles) ? parsed.roles : undefined,
                                incremental: typeof parsed.incremental === 'boolean' ? parsed.incremental : null,
                                autoSuggestCount: typeof parsed.autoSuggestCount === 'boolean'
                                    ? parsed.autoSuggestCount
                                    : undefined,
                            }];
                    }
                    catch (error) {
                        console.error('Failed to parse intent JSON', error);
                        // Fallback intent
                        return [2 /*return*/, {
                                intentType: 'ASK_EXPLANATION',
                                role: null,
                                skills: null,
                                experienceLevel: null,
                                employeeCount: null,
                                constraints: null,
                                roles: undefined,
                                autoSuggestCount: undefined,
                            }];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
