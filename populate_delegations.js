"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Store_1 = require("./src/models/Store");
const delegation_1 = require("./src/core/delegation");
async function run() {
    const users = [
        { id: 'alice', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} },
        { id: 'bob', name: 'Bob', voiceCredits: 100, reputation: {}, delegates: {} },
        { id: 'charlie', name: 'Charlie', voiceCredits: 100, reputation: {}, delegates: {} },
        { id: 'dave', name: 'Dave', voiceCredits: 100, reputation: {}, delegates: {} },
    ];
    users.forEach(u => Store_1.globalStore.addUser(u));
    // Create a chain Alice -> Bob -> Dave
    (0, delegation_1.delegate)(Store_1.globalStore, 'alice', 'bob', 'Roads');
    (0, delegation_1.delegate)(Store_1.globalStore, 'bob', 'dave', 'Roads');
    // Charlie -> Dave
    (0, delegation_1.delegate)(Store_1.globalStore, 'charlie', 'dave', 'Roads');
    console.log('Database populated with delegations');
}
run();
//# sourceMappingURL=populate_delegations.js.map