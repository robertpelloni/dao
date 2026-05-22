import { IdentityManager } from '../src/core/identity';
import { Store } from '../src/models/Store';

describe('Identity Layer (Sybil Resistance)', () => {
  let store: Store;
  let identity: IdentityManager;

  beforeEach(() => {
    store = new Store();
    identity = new IdentityManager(store);
  });

  test('should create a default unverified profile', () => {
    const profile = identity.createProfile('user-1');
    expect(profile.isVerified).toBe(false);
    expect(profile.verificationScore).toBe(0);
  });

  test('should increase score through endorsements', () => {
    identity.createProfile('alice');
    identity.createProfile('bob');

    identity.endorse('alice', 'bob');
    expect(identity.getProfile('bob')?.verificationScore).toBe(5);
  });

  test('should auto-verify when score reaches 50', () => {
    identity.createProfile('v1'); // Verified seed
    identity.verifyManually('v1');

    identity.createProfile('bob');

    identity.endorse('v1', 'bob'); // +25
    expect(identity.isVerified('bob')).toBe(false);

    identity.createProfile('v2');
    identity.verifyManually('v2');
    identity.endorse('v2', 'bob'); // +25 = 50

    expect(identity.isVerified('bob')).toBe(true);
  });

  test('manual verification should set score to 100', () => {
    identity.createProfile('admin');
    identity.verifyManually('admin');
    expect(identity.isVerified('admin')).toBe(true);
    expect(identity.getProfile('admin')?.verificationScore).toBe(100);
  });
});
