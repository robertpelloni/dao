import { globalStore } from './src/models/Store';
import { User } from './src/models/types';
import { delegate } from './src/core/delegation';

async function run() {
  const users: User[] = [
    { id: 'alice', name: 'Alice', voiceCredits: 100, reputation: {}, delegates: {} },
    { id: 'bob', name: 'Bob', voiceCredits: 100, reputation: {}, delegates: {} },
    { id: 'charlie', name: 'Charlie', voiceCredits: 100, reputation: {}, delegates: {} },
    { id: 'dave', name: 'Dave', voiceCredits: 100, reputation: {}, delegates: {} },
  ];

  users.forEach(u => globalStore.addUser(u));

  // Create a chain Alice -> Bob -> Dave
  delegate(globalStore, 'alice', 'bob', 'Roads');
  delegate(globalStore, 'bob', 'dave', 'Roads');

  // Charlie -> Dave
  delegate(globalStore, 'charlie', 'dave', 'Roads');

  console.log('Database populated with delegations');
}

run();
