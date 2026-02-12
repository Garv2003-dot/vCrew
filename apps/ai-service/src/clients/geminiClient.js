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
exports.callGemini = callGemini;
var generative_ai_1 = require("@google/generative-ai");
// Ensure env is loaded when running as standalone or when API hasn't loaded it
if (typeof process !== 'undefined' && !process.env.GEMINI_API_KEY) {
    try {
        require('dotenv').config();
    }
    catch (_a) {
        // dotenv optional
    }
}
/**
 * Sends a prompt to Gemini and returns the generated text.
 * Same contract as the previous callOllama: (prompt: string) => Promise<string>
 * so existing JSON parsing and validation continue to work unchanged.
 */
function callGemini(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, genAI, model, result, response, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        throw new Error('GEMINI_API_KEY is not set. Add it to .env (see .env.example).');
                    }
                    genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
                    model = genAI.getGenerativeModel({
                        model: 'gemini-2.5-flash',
                        generationConfig: {
                            temperature: 0.2,
                            topP: 0.95,
                            maxOutputTokens: 8192,
                        },
                    });
                    return [4 /*yield*/, model.generateContent(prompt)];
                case 1:
                    result = _a.sent();
                    response = result.response;
                    if (!response) {
                        throw new Error('Gemini returned no response');
                    }
                    text = response.text();
                    if (text === undefined || text === null) {
                        throw new Error('Gemini response had no text');
                    }
                    return [2 /*return*/, text];
            }
        });
    });
}
