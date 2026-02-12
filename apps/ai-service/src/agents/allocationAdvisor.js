"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProjectDemand = normalizeProjectDemand;
exports.generateAllocation = generateAllocation;
exports.processAgentInstruction = processAgentInstruction;
var geminiClient_1 = require("../clients/geminiClient");
var intentAgent_1 = require("./intentAgent");
var ROLE_SYNONYMS = {
    backend: ['backend', 'server', 'api', 'node', 'java', 'go', 'python'],
    frontend: ['frontend', 'ui', 'react', 'angular', 'vue', 'web'],
    devops: ['devops', 'infra', 'sre', 'cloud', 'aws', 'platform'],
    mobile: ['mobile', 'ios', 'android', 'react native', 'flutter'],
    qa: ['qa', 'testing', 'automation', 'sdet'],
    design: ['design', 'ux', 'ui', 'product designer'],
    manager: ['manager', 'lead', 'em', 'director'],
};
// Helper to resolve skills from role if missing
function resolvePrimarySkills(intent, originalDemand) {
    if (intent.skills && intent.skills.length > 0) {
        return intent.skills;
    }
    var mapRoleToSkills = function (r) {
        var roleLower = r.toLowerCase();
        if (ROLE_SYNONYMS.backend.some(function (s) { return roleLower.includes(s); }))
            return ['Node.js', 'API'];
        if (ROLE_SYNONYMS.frontend.some(function (s) { return roleLower.includes(s); }))
            return ['React', 'TypeScript'];
        if (ROLE_SYNONYMS.devops.some(function (s) { return roleLower.includes(s); }))
            return ['Docker', 'Kubernetes'];
        return [];
    };
    if (intent.role) {
        if (Array.isArray(intent.role)) {
            return Array.from(new Set(intent.role.flatMap(mapRoleToSkills)));
        }
        return mapRoleToSkills(intent.role);
    }
    return originalDemand.primarySkills;
}
// 1️⃣ ADAPTER: Normalize Project Demand
function normalizeProjectDemand(demand, projects, previousDemand) {
    // If already canonical, return (or re-verify)
    if (demand.isCanonical) {
        return demand;
    }
    var canonicalRoles = __spreadArray([], (demand.roles || []), true);
    // If EXISTING, merge with actual project state + any manual changes
    if (demand.projectType === 'EXISTING' && demand.projectId) {
        var project = projects.find(function (p) { return p.id === demand.projectId; });
        if (project && project.assignedEmployees) {
            // Map existing assignments to roles
            var existingRolesMap_1 = new Map();
            project.assignedEmployees.forEach(function (ass) {
                // Determine role name (from assignment or fetch from employee if we had access here, assuming ass.roleName exists)
                var roleName = ass.roleName || 'Unknown Role';
                existingRolesMap_1.set(roleName, (existingRolesMap_1.get(roleName) || 0) + 1);
            });
            // Merge: Ensure canonicalRoles contains these, with AT LEAST this headcount
            existingRolesMap_1.forEach(function (count, role) {
                var existingDemandRole = canonicalRoles.find(function (r) { return r.roleName === role; });
                if (existingDemandRole) {
                    // Drift prevention: The demand SHOULD reflect reality + openness
                    // If demand says 0 but we have 2, demand is 2 (filled).
                    existingDemandRole.headcount = Math.max(existingDemandRole.headcount, count);
                }
                else {
                    // Add implied role from existing team
                    canonicalRoles.push({
                        roleName: role,
                        headcount: count,
                        requiredSkills: [], // derived or default
                        experienceLevel: 'MID', // default
                        allocationPercent: 100,
                    });
                }
            });
        }
    }
    // Preserve change log or init new
    var changeLog = (previousDemand === null || previousDemand === void 0 ? void 0 : previousDemand.changeLog) || [];
    return __assign(__assign({}, demand), { roles: canonicalRoles, isCanonical: true, changeLog: changeLog });
}
// 2️⃣ Resolve Candidates: Deterministic Filtering with Synonyms
function resolveCandidates(roleName, requiredSkills, employees) {
    return employees.filter(function (e) {
        // 1. Availability constraint
        if (e.availabilityPercent < 20)
            return false;
        // 2. Status constraint
        if (e.status === 'ON_LEAVE')
            return false;
        // 3. Role Constraint (STRICT but SYNONYM-AWARE)
        var eRole = e.role.toLowerCase();
        var rLower = roleName.toLowerCase();
        // Check direct inclusion first
        var match = eRole.includes(rLower);
        // If no direct match, check synonyms
        if (!match) {
            // Find which canonical group the requested role belongs to
            var group = Object.values(ROLE_SYNONYMS).find(function (synonyms) {
                return synonyms.some(function (s) { return rLower.includes(s); });
            });
            if (group) {
                // If requested role is in a group, check if employee role is also in that group
                match = group.some(function (s) { return eRole.includes(s); });
            }
        }
        if (!match)
            return false;
        // 4. Skill constraint (Must match at least one primary skill)
        if (!requiredSkills || requiredSkills.length === 0)
            return true;
        var employeeSkills = new Set(e.skills.map(function (s) { return s.name.toLowerCase(); }));
        var reqSkillsLower = requiredSkills.map(function (s) { return s.toLowerCase(); });
        return reqSkillsLower.some(function (req) { return employeeSkills.has(req); });
    });
}
// 2️⃣ Rank Candidates with AI (Validated)
function rankCandidatesWithAI(roleName, candidates) {
    return __awaiter(this, void 0, void 0, function () {
        var candidateContext, prompt, raw, start, end, jsonStr, fixedJsonStr, parsed, seen, validated, validIds, _i, _a, r, confidence, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (candidates.length === 0)
                        return [2 /*return*/, []];
                    candidateContext = candidates
                        .map(function (e) {
                        return "- ".concat(e.name, " (id: ").concat(e.id, "): ").concat(e.role, ", ").concat(e.experienceLevel, ", Skills: ").concat(e.skills.map(function (s) { return s.name; }).join(', '), ", Availability: ").concat(e.availabilityPercent, "%");
                    })
                        .join('\n');
                    prompt = "\nYou are a senior technical recruiter ranking candidates for the role: ".concat(roleName, ".\n\nCandidates:\n").concat(candidateContext, "\n\nReturn ONLY valid JSON:\n{\n  \"rankedCandidates\": [\n    { \"employeeId\": string, \"confidence\": number, \"reason\": string }\n  ]\n}\n\nRules:\n- Rank candidates best suited for ").concat(roleName, ".\n- Confidence 0-1 (1 = perfect match).\n- Reason must be short and specific.\n- Return ALL candidates provided in the list.\n");
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, geminiClient_1.callGemini)(prompt)];
                case 2:
                    raw = _b.sent();
                    console.log('[DEBUG] AI Ranking RAW:', raw);
                    start = raw.indexOf('{');
                    end = raw.lastIndexOf('}');
                    if (start === -1 || end === -1)
                        throw new Error('No JSON found');
                    jsonStr = raw.substring(start, end + 1);
                    fixedJsonStr = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');
                    parsed = void 0;
                    try {
                        parsed = JSON.parse(fixedJsonStr);
                    }
                    catch (parseError) {
                        // 2️⃣ Never trust repaired JSON silently - FAIL LOUDLY
                        console.error('AI ranking output INVALID. Falling back to deterministic ranking.', parseError);
                        throw parseError; // Force fallback
                    }
                    if (!Array.isArray(parsed.rankedCandidates)) {
                        throw new Error('Invalid ranking payload: rankedCandidates is not an array');
                    }
                    // 1️⃣ Enforce ranking output schema: employeeId string, confidence number or string (LLM may return "1.0")
                    if (!parsed.rankedCandidates.every(function (r) {
                        return typeof r.employeeId === 'string' &&
                            (typeof r.confidence === 'number' ||
                                (typeof r.confidence === 'string' &&
                                    !Number.isNaN(Number(r.confidence))));
                    })) {
                        throw new Error('Invalid ranking payload: schema mismatch');
                    }
                    seen = new Set();
                    validated = [];
                    validIds = new Set(candidates.map(function (c) { return c.id; }));
                    for (_i = 0, _a = parsed.rankedCandidates; _i < _a.length; _i++) {
                        r = _a[_i];
                        if (validIds.has(r.employeeId) && // Must be a real candidate we sent
                            !seen.has(r.employeeId) // Must not be a duplicate
                        ) {
                            seen.add(r.employeeId);
                            confidence = typeof r.confidence === 'number'
                                ? r.confidence
                                : Math.min(1, Math.max(0, Number(r.confidence)));
                            validated.push({
                                employeeId: r.employeeId,
                                confidence: confidence,
                                reason: typeof r.reason === 'string' ? r.reason : 'Ranked by AI',
                            });
                        }
                    }
                    return [2 /*return*/, validated];
                case 3:
                    error_1 = _b.sent();
                    console.error('Failed to rank candidates:', error_1);
                    // 🔒 HARD GUARANTEE: preserve candidate identity + order
                    return [2 /*return*/, candidates.map(function (c, index) { return ({
                            employeeId: c.id,
                            confidence: 0.5 - index * 0.01, // deterministic tie-break
                            reason: 'Default ranking due to AI parsing failure.',
                        }); })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// 3️⃣ GENERATE ALLOCATION (Refactored for Robustness)
function generateAllocation(rawDemand_1, employees_1) {
    return __awaiter(this, arguments, void 0, function (rawDemand, employees, projects) {
        var demand, roleAllocations, _loop_1, _i, _a, roleDemand;
        if (projects === void 0) { projects = []; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('[DEBUG] generateAllocation (Refactored) called');
                    demand = normalizeProjectDemand(rawDemand, projects);
                    roleAllocations = [];
                    _loop_1 = function (roleDemand) {
                        var roleName, headcount, requiredSkills, allocationPercent, existingRecommendations, project, currentHeadcount, candidatesNeeded, finalRecs, skills, candidates, existingIds_1, available_1, rankedStrats, newRecs;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    roleName = roleDemand.roleName, headcount = roleDemand.headcount, requiredSkills = roleDemand.requiredSkills, allocationPercent = roleDemand.allocationPercent;
                                    existingRecommendations = [];
                                    if (demand.projectId && demand.projectType === 'EXISTING') {
                                        project = projects.find(function (p) { return p.id === demand.projectId; });
                                        if (project && project.assignedEmployees) {
                                            project.assignedEmployees.forEach(function (ass) {
                                                // Check if this assignment maps to current role
                                                // (Simple matching or synonym check could go here, for now assumes roleName matches or fallback)
                                                var emp = employees.find(function (e) { return e.id === ass.employeeId; });
                                                if (emp) {
                                                    var assRole = ass.roleName || emp.role; // preferred role name
                                                    // Flexible match: if assignment role matches the demand role
                                                    if (assRole.toLowerCase() === roleName.toLowerCase()) {
                                                        existingRecommendations.push({
                                                            employeeId: emp.id,
                                                            employeeName: emp.name,
                                                            currentRole: emp.role,
                                                            confidence: 1.0,
                                                            reason: 'Already assigned to this project.',
                                                            status: 'EXISTING',
                                                            allocationPercent: ass.allocationPercent,
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    currentHeadcount = existingRecommendations.length;
                                    candidatesNeeded = Math.max(0, headcount - currentHeadcount);
                                    finalRecs = __spreadArray([], existingRecommendations, true);
                                    if (!(candidatesNeeded > 0)) return [3 /*break*/, 3];
                                    skills = requiredSkills.map(function (s) { return s.name; });
                                    candidates = resolveCandidates(roleName, skills, employees);
                                    existingIds_1 = new Set(existingRecommendations.map(function (r) { return r.employeeId; }));
                                    available_1 = candidates.filter(function (c) { return !existingIds_1.has(c.id); });
                                    rankedStrats = [];
                                    if (!(available_1.length > 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, rankCandidatesWithAI(roleName, available_1)];
                                case 1:
                                    rankedStrats = _c.sent();
                                    _c.label = 2;
                                case 2:
                                    newRecs = rankedStrats
                                        .slice(0, candidatesNeeded)
                                        .map(function (r) {
                                        var emp = available_1.find(function (e) { return e.id === r.employeeId; });
                                        if (!emp)
                                            return null;
                                        var targetAlloc = allocationPercent || 100;
                                        var finalAlloc = Math.min(targetAlloc, emp.availabilityPercent);
                                        return {
                                            employeeId: emp.id,
                                            employeeName: emp.name,
                                            currentRole: emp.role,
                                            confidence: r.confidence,
                                            reason: r.reason,
                                            status: 'NEW',
                                            allocationPercent: finalAlloc,
                                        };
                                    })
                                        .filter(function (r) { return r !== null; });
                                    finalRecs = __spreadArray(__spreadArray([], finalRecs, true), newRecs, true);
                                    _c.label = 3;
                                case 3:
                                    roleAllocations.push({
                                        roleName: roleName,
                                        recommendations: finalRecs,
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _a = demand.roles;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    roleDemand = _a[_i];
                    return [5 /*yield**/, _loop_1(roleDemand)];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, {
                        projectName: demand.projectName,
                        projectId: demand.projectId,
                        type: demand.projectType,
                        generatedAt: new Date().toISOString(),
                        roleAllocations: roleAllocations,
                    }];
            }
        });
    });
}
// Helper to determine headcount dynamically
function recommendHeadcount(roleName, currentProposal, originalDemand) {
    return __awaiter(this, void 0, void 0, function () {
        var currentAllocationSummary, prompt, raw, num, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[DEBUG] Recommending headcount for ".concat(roleName));
                    currentAllocationSummary = currentProposal.roleAllocations
                        .map(function (r) { return "".concat(r.roleName, ": ").concat(r.recommendations.length); })
                        .join(', ');
                    prompt = "\nYou are a resource planning expert.\nProject: ".concat(originalDemand.projectName, "\nType: ").concat(originalDemand.projectType, "\nContext: ").concat(originalDemand.context || 'None', "\nCurrent Allocation: ").concat(currentAllocationSummary || 'None', "\n\nUser wants to add: \"").concat(roleName, "\".\nDecide the appropriate number of \"").concat(roleName, "\" resources to add.\n\nRules:\n- Analyze standard ratios (e.g., 1 QA per 3-4 Devs, 1 DevOps per project or per 5-10 Devs).\n- Consider project context.\n- Returns ONLY the integer number.\n- Default to 1 if unsure or if the request implies a single resource (e.g., \"add a devops\").\n- Be conservative. Do not add too many unless strictly necessary.\n");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, geminiClient_1.callGemini)(prompt)];
                case 2:
                    raw = _a.sent();
                    num = Number.parseInt(raw.trim(), 10);
                    return [2 /*return*/, Number.isNaN(num) ? 1 : num];
                case 3:
                    e_1 = _a.sent();
                    console.error('Failed to recommend headcount', e_1);
                    return [2 /*return*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Helper for ADD_EMPLOYEES logic
function handleAddEmployees(intent, employees, currentProposal, originalDemand) {
    return __awaiter(this, void 0, void 0, function () {
        var hasRole, hasRolesArray, roleRequests, updatedProposal, messages, _i, roleRequests_1, req, roleName, count, result, e_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    // Ensure structure exists
                    if (!currentProposal.roleAllocations) {
                        currentProposal.roleAllocations = [];
                    }
                    hasRole = intent.role && (!Array.isArray(intent.role) || intent.role.length > 0);
                    hasRolesArray = intent.roles && intent.roles.length > 0;
                    if (!hasRole && !hasRolesArray) {
                        return [2 /*return*/, {
                                proposal: currentProposal,
                                message: "Please specify which role you'd like to add (e.g., 'Add a backend developer').",
                            }];
                    }
                    roleRequests = intent.roles && intent.roles.length > 0
                        ? intent.roles
                        : [
                            {
                                roleName: Array.isArray(intent.role)
                                    ? intent.role[0]
                                    : intent.role,
                                count: intent.employeeCount || 1,
                            },
                        ];
                    updatedProposal = __assign({}, currentProposal);
                    messages = [];
                    _i = 0, roleRequests_1 = roleRequests;
                    _a.label = 1;
                case 1:
                    if (!(_i < roleRequests_1.length)) return [3 /*break*/, 6];
                    req = roleRequests_1[_i];
                    roleName = req.roleName;
                    count = req.count;
                    if (!intent.autoSuggestCount) return [3 /*break*/, 3];
                    return [4 /*yield*/, recommendHeadcount(roleName, updatedProposal, originalDemand)];
                case 2:
                    count = _a.sent();
                    messages.push("(AI suggested adding ".concat(count, " ").concat(roleName, "(s))"));
                    _a.label = 3;
                case 3: return [4 /*yield*/, handleAddSingleRole(roleName, count, employees, updatedProposal, originalDemand, intent)];
                case 4:
                    result = _a.sent();
                    updatedProposal = result.proposal;
                    if (result.message) {
                        messages.push(result.message);
                    }
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, {
                        proposal: updatedProposal,
                        message: messages.join(' '),
                    }];
                case 7:
                    e_2 = _a.sent();
                    console.error('Error adding employees', e_2);
                    return [2 /*return*/, {
                            proposal: currentProposal,
                            message: 'I failed to add the requested employees.',
                        }];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function handleAddSingleRole(roleName, count, employees, currentProposal, originalDemand, intent) {
    return __awaiter(this, void 0, void 0, function () {
        var resolvedSkills, candidates, currentIds, availableCandidates, existingRole, currentCount, candidatesToAddCount, ranked, topCandidates, mergedProposal, targetRoleRef, MAX_EXTRA_PER_ROLE, finalCount, originalRole, baseCount;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    resolvedSkills = resolvePrimarySkills(intent, originalDemand);
                    candidates = resolveCandidates(roleName, resolvedSkills || [], employees);
                    currentIds = new Set(currentProposal.roleAllocations.flatMap(function (r) {
                        return r.recommendations.map(function (re) { return re.employeeId; });
                    }));
                    availableCandidates = candidates.filter(function (e) { return !currentIds.has(e.id); });
                    if (availableCandidates.length === 0) {
                        return [2 /*return*/, {
                                proposal: currentProposal,
                                message: "I couldn't find any available ".concat(roleName, " candidates matching the criteria."),
                            }];
                    }
                    existingRole = currentProposal.roleAllocations.find(function (r) { return r.roleName.toLowerCase() === roleName.toLowerCase(); });
                    currentCount = existingRole ? existingRole.recommendations.length : 0;
                    candidatesToAddCount = intent.incremental
                        ? count
                        : Math.max(0, count - currentCount);
                    if (candidatesToAddCount <= 0) {
                        return [2 /*return*/, {
                                proposal: currentProposal,
                                message: "You already have ".concat(currentCount, " ").concat(roleName, "(s) allocated (Target: ").concat(count, "). No more needed."),
                            }];
                    }
                    return [4 /*yield*/, rankCandidatesWithAI(roleName, availableCandidates)];
                case 1:
                    ranked = _b.sent();
                    topCandidates = ranked
                        .slice(0, candidatesToAddCount)
                        .map(function (r) {
                        var emp = availableCandidates.find(function (e) { return e.id === r.employeeId; });
                        if (!emp) {
                            console.warn("[WARN] Ranked employee ".concat(r.employeeId, " not found in availableCandidates"));
                            return null;
                        }
                        var finalAlloc = Math.min(100, emp.availabilityPercent);
                        return {
                            employeeId: emp.id,
                            employeeName: emp.name,
                            currentRole: emp.role,
                            confidence: r.confidence,
                            reason: r.reason,
                            status: 'NEW', // Mark as NEW
                            allocationPercent: finalAlloc,
                        };
                    })
                        .filter(function (r) { return r !== null; });
                    mergedProposal = __assign({}, currentProposal);
                    // Double check roleAllocations exists on mergedProposal
                    if (!mergedProposal.roleAllocations)
                        mergedProposal.roleAllocations = [];
                    targetRoleRef = mergedProposal.roleAllocations.find(function (r) { return r.roleName.toLowerCase() === roleName.toLowerCase(); });
                    MAX_EXTRA_PER_ROLE = 3;
                    finalCount = (targetRoleRef ? targetRoleRef.recommendations.length : 0) +
                        topCandidates.length;
                    originalRole = (originalDemand.roles || []).find(function (r) { return r.roleName.toLowerCase() === roleName.toLowerCase(); });
                    baseCount = originalRole ? originalRole.headcount : 0;
                    if (finalCount > baseCount + MAX_EXTRA_PER_ROLE) {
                        return [2 /*return*/, {
                                proposal: currentProposal,
                                message: "I cannot add more ".concat(roleName, "s. This role already has sufficient coverage (Limit: ").concat(baseCount + MAX_EXTRA_PER_ROLE, ")."),
                            }];
                    }
                    if (targetRoleRef) {
                        (_a = targetRoleRef.recommendations).push.apply(_a, topCandidates);
                    }
                    else {
                        mergedProposal.roleAllocations.push({
                            roleName: roleName,
                            recommendations: topCandidates,
                        });
                    }
                    return [2 /*return*/, {
                            proposal: mergedProposal,
                            message: "I've added ".concat(topCandidates.length, " ").concat(roleName, "(s) to the allocation."),
                        }];
            }
        });
    });
}
// Helper for REPLACE_EMPLOYEE logic
function handleReplaceEmployee(intent, employees, currentProposal, originalDemand) {
    return __awaiter(this, void 0, void 0, function () {
        var targetName, removedCount, removedRoleName, removedRec, updatedAllocations, roleToFill, resolvedSkills, candidates, currentIds, availableCandidates, ranked, top_1, replacement, targetRole, inherited, finalAlloc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetName = intent.targetEmployeeName;
                    removedCount = 0;
                    removedRoleName = '';
                    removedRec = null;
                    updatedAllocations = currentProposal.roleAllocations.map(function (role) {
                        var initialLen = role.recommendations.length;
                        // Find who we are removing
                        var toRemove = role.recommendations.find(function (rec) {
                            return targetName &&
                                rec.employeeName.toLowerCase().includes(targetName.toLowerCase());
                        });
                        if (toRemove) {
                            removedRec = toRemove;
                            role.recommendations = role.recommendations.filter(function (r) { return r !== toRemove; });
                            removedCount++;
                            removedRoleName = role.roleName;
                            // Mark as REMOVED if we were tracking partial state, but here we physically remove from list
                            // If we wanted to keep track of removed ones visually, we'd change status to 'REMOVED' instead of filtering.
                            // For now, let's filter out to keep list clean, but AI response says "replaced".
                        }
                        return role;
                    });
                    if (removedCount === 0) {
                        return [2 /*return*/, {
                                proposal: currentProposal,
                                message: "I couldn't find that employee to replace.",
                            }];
                    }
                    roleToFill = removedRoleName;
                    if (intent.role) {
                        roleToFill = Array.isArray(intent.role) ? intent.role[0] : intent.role;
                    }
                    resolvedSkills = resolvePrimarySkills(intent, originalDemand);
                    candidates = resolveCandidates(roleToFill, resolvedSkills || [], employees);
                    currentIds = new Set(updatedAllocations.flatMap(function (r) {
                        return r.recommendations.map(function (re) { return re.employeeId; });
                    }));
                    availableCandidates = candidates.filter(function (e) {
                        return !currentIds.has(e.id) &&
                            (!targetName || !e.name.toLowerCase().includes(targetName.toLowerCase()));
                    });
                    if (availableCandidates.length === 0) {
                        return [2 /*return*/, {
                                proposal: __assign(__assign({}, currentProposal), { roleAllocations: updatedAllocations }),
                                message: "I removed ".concat(targetName, " but found NO suitable candidates to take their place."),
                            }];
                    }
                    return [4 /*yield*/, rankCandidatesWithAI(roleToFill, availableCandidates)];
                case 1:
                    ranked = _a.sent();
                    if (ranked.length > 0) {
                        top_1 = ranked[0];
                        replacement = availableCandidates.find(function (e) { return e.id === top_1.employeeId; });
                        if (replacement) {
                            targetRole = updatedAllocations.find(function (r) { return r.roleName === removedRoleName; });
                            if (targetRole) {
                                inherited = removedRec ? removedRec.allocationPercent : 100;
                                finalAlloc = Math.min(inherited, replacement.availabilityPercent);
                                targetRole.recommendations.push({
                                    employeeId: replacement.id,
                                    employeeName: replacement.name,
                                    currentRole: replacement.role,
                                    confidence: top_1.confidence,
                                    reason: top_1.reason,
                                    status: 'NEW',
                                    allocationPercent: finalAlloc,
                                });
                            }
                            return [2 /*return*/, {
                                    proposal: __assign(__assign({}, currentProposal), { roleAllocations: updatedAllocations }),
                                    message: "I've replaced ".concat(targetName, " with ").concat(replacement.name, "."),
                                }];
                        }
                    }
                    return [2 /*return*/, {
                            proposal: __assign(__assign({}, currentProposal), { roleAllocations: updatedAllocations }),
                            message: "I removed ".concat(targetName, " but couldn't find a suitable replacement."),
                        }];
            }
        });
    });
}
// 🧠 The Agent Orchestrator
// 4️⃣ AGENT INSTRUCTION PROCESSOR
function processAgentInstruction(userMessage_1, employees_1, currentProposal_1, originalDemand_1) {
    return __awaiter(this, arguments, void 0, function (userMessage, employees, currentProposal, originalDemand, // This comes from API/Client
    conversationHistory, projects) {
        var canonicalDemand, state, intent, _a, finalDemand_1, _b;
        var _c, _d, _e;
        var _f;
        if (conversationHistory === void 0) { conversationHistory = []; }
        if (projects === void 0) { projects = []; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    canonicalDemand = normalizeProjectDemand(originalDemand, projects);
                    state = {
                        demand: canonicalDemand,
                        employees: employees,
                        projects: projects,
                        currentProposal: currentProposal,
                        history: conversationHistory,
                    };
                    return [4 /*yield*/, (0, intentAgent_1.extractAllocationIntent)(userMessage, state.history)];
                case 1:
                    intent = _g.sent();
                    console.log('🤖 Agent Intent:', intent);
                    _a = intent.intentType;
                    switch (_a) {
                        case 'CREATE_ALLOCATION': return [3 /*break*/, 2];
                        case 'ADD_EMPLOYEES': return [3 /*break*/, 4];
                        case 'REPLACE_EMPLOYEE': return [3 /*break*/, 7];
                        case 'ASK_EXPLANATION': return [3 /*break*/, 8];
                    }
                    return [3 /*break*/, 9];
                case 2:
                    _c = {};
                    return [4 /*yield*/, generateAllocation(state.demand, state.employees, state.projects)];
                case 3: return [2 /*return*/, (_c.proposal = _g.sent(),
                        _c.message = "I've created a new allocation based on your requirements.",
                        _c)];
                case 4:
                    if (!!state.currentProposal) return [3 /*break*/, 6];
                    console.warn('Handling ADD_EMPLOYEES checks as CREATE due to missing proposal');
                    finalDemand_1 = __assign({}, state.demand);
                    if (intent.employeeCount || intent.role) {
                        finalDemand_1.roles = finalDemand_1.roles.map(function (r) {
                            var targetRoleName = r.roleName;
                            if (intent.role &&
                                !Array.isArray(intent.role) &&
                                finalDemand_1.roles.length === 1) {
                                targetRoleName = intent.role;
                            }
                            return __assign(__assign({}, r), { headcount: intent.employeeCount || r.headcount, roleName: targetRoleName });
                        });
                    }
                    _d = {};
                    return [4 /*yield*/, generateAllocation(finalDemand_1, state.employees, state.projects)];
                case 5: return [2 /*return*/, (_d.proposal = _g.sent(),
                        _d.message = "I've created a new allocation based on your request (started fresh).",
                        _d)];
                case 6: return [2 /*return*/, handleAddEmployees(intent, state.employees, state.currentProposal, state.demand)];
                case 7:
                    {
                        if (!state.currentProposal)
                            throw new Error('No active allocation to modify.');
                        return [2 /*return*/, handleReplaceEmployee(intent, state.employees, state.currentProposal, state.demand)];
                    }
                    _g.label = 8;
                case 8: return [2 /*return*/, {
                        proposal: state.currentProposal,
                        message: 'Analysis: The current allocation is optimized for ' +
                            (((_f = state.demand.primarySkills) === null || _f === void 0 ? void 0 : _f.join(', ')) || 'the requirements') +
                            '.',
                    }];
                case 9:
                    _e = {};
                    _b = state.currentProposal;
                    if (_b) return [3 /*break*/, 11];
                    return [4 /*yield*/, generateAllocation(state.demand, state.employees, state.projects)];
                case 10:
                    _b = (_g.sent());
                    _g.label = 11;
                case 11: return [2 /*return*/, (_e.proposal = _b,
                        _e.message = 'I processed your request.',
                        _e)];
            }
        });
    });
}
