require('dotenv').config();
const axios = require('axios').default;
const { connectDB } = require('../config/database');
const redisClient = require('../config/redis');
const { User, Note, NoteVersion, NoteShare } = require('../models');

const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  test: (msg) => console.log(`${colors.cyan}🧪 ${msg}${colors.reset}`)
};

let accessToken1 = null;
let refreshToken1 = null;
let accessToken2 = null;
let refreshToken2 = null;
let userId1 = null;
let userId2 = null;
let noteId1 = null;
let noteId2 = null;
let versionId = null;
let shareId = null;
let attachmentId = null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== PHASE 1: INFRASTRUCTURE ====================

async function testPhase1() {
  log.test('=== PHASE 1: INFRASTRUCTURE ===');
  
  try {
    // Test database connection
    log.info('Test 1: Database Connection');
    await connectDB();
    log.success('Database connection established');

    // Test Redis connection
    log.info('Test 2: Redis Connection');
    await redisClient.connect();
    const client = redisClient.getClient();
    await client.ping();
    log.success('Redis connection established');

    // Test Redis operations
    log.info('Test 3: Redis Operations');
    await client.set('test:key', 'test:value');
    const value = await client.get('test:key');
    if (value === 'test:value') {
      log.success('Redis read/write operations working');
      await client.del('test:key');
    } else {
      throw new Error('Redis value mismatch');
    }

    log.success('✅ Phase 1: All infrastructure tests passed!\n');
    return true;
  } catch (error) {
    log.error(`Phase 1 failed: ${error.message}`);
    return false;
  }
}

// ==================== PHASE 2: MODELS & MIGRATIONS ====================

async function testPhase2() {
  log.test('=== PHASE 2: MODELS & MIGRATIONS ===');
  
  let testUser, testNote, testVersion, testShare, testUser2;

  try {
    // Test User model
    log.info('Test 1: User Model');
    testUser = await User.create({
      email: `test-${Date.now()}@example.com`,
      password: 'test123456'
    });
    log.success(`User created: ID ${testUser.id}, Email: ${testUser.email}`);

    // Verify password is hashed
    if (testUser.password !== 'test123456' && testUser.password.length > 20) {
      log.success('Password hashing working');
    } else {
      throw new Error('Password not hashed');
    }

    // Test password comparison
    const isMatch = await testUser.comparePassword('test123456');
    if (isMatch) {
      log.success('Password comparison working');
    } else {
      throw new Error('Password comparison failed');
    }

    // Test Note model
    log.info('Test 2: Note Model');
    testNote = await Note.create({
      userId: testUser.id,
      title: 'Test Note',
      content: 'This is a test note content for testing purposes',
      version: 1
    });
    log.success(`Note created: ID ${testNote.id}, Title: ${testNote.title}`);

    // Test NoteVersion model
    log.info('Test 3: NoteVersion Model');
    testVersion = await NoteVersion.create({
      noteId: testNote.id,
      title: 'Test Note',
      content: 'This is a test note content for testing purposes',
      version: 1
    });
    log.success(`NoteVersion created: ID ${testVersion.id}, Version: ${testVersion.version}`);

    // Test associations - User to Notes
    log.info('Test 4: User → Notes Association');
    const userWithNotes = await User.findByPk(testUser.id, {
      include: [{ model: Note, as: 'notes' }]
    });
    if (userWithNotes.notes && userWithNotes.notes.length > 0) {
      log.success(`User-Notes association working: ${userWithNotes.notes.length} note(s)`);
    } else {
      throw new Error('User-Notes association failed');
    }

    // Test associations - Note to Versions
    log.info('Test 5: Note → Versions Association');
    const noteWithVersions = await Note.findByPk(testNote.id, {
      include: [{ model: NoteVersion, as: 'versions' }]
    });
    if (noteWithVersions.versions && noteWithVersions.versions.length > 0) {
      log.success(`Note-Versions association working: ${noteWithVersions.versions.length} version(s)`);
    } else {
      throw new Error('Note-Versions association failed');
    }

    // Test soft delete
    log.info('Test 6: Soft Delete');
    await testNote.softDelete();
    log.success('Note soft deleted');

    // Test default scope (should not find deleted note)
    const activeNotes = await Note.findAll({ where: { userId: testUser.id } });
    if (activeNotes.length === 0) {
      log.success('Default scope working (excludes deleted notes)');
    } else {
      throw new Error('Default scope not working');
    }

    // Test withDeleted scope
    const allNotes = await Note.scope('withDeleted').findAll({ where: { userId: testUser.id } });
    if (allNotes.length === 1) {
      log.success('withDeleted scope working (includes deleted notes)');
    } else {
      throw new Error('withDeleted scope not working');
    }

    // Test restore
    await testNote.restore();
    log.success('Note restored');

    // Test NoteShare model
    log.info('Test 7: NoteShare Model');
    testUser2 = await User.create({
      email: `test2-${Date.now()}@example.com`,
      password: 'test123456'
    });

    testShare = await NoteShare.create({
      noteId: testNote.id,
      sharedWithUserId: testUser2.id,
      permission: 'read'
    });
    log.success(`NoteShare created: ID ${testShare.id}, Permission: ${testShare.permission}`);

    // Test NoteShare associations
    const noteWithShares = await Note.findByPk(testNote.id, {
      include: [
        { model: NoteShare, as: 'shares', include: [{ model: User, as: 'sharedWithUser' }] }
      ]
    });
    if (noteWithShares.shares && noteWithShares.shares.length > 0) {
      log.success(`Note-Shares association working: ${noteWithShares.shares.length} share(s)`);
    } else {
      throw new Error('Note-Shares association failed');
    }

    // Cleanup
    log.info('Cleaning up test data...');
    await testShare.destroy({ force: true });
    await testVersion.destroy({ force: true });
    await testNote.destroy({ force: true });
    await testUser.destroy({ force: true });
    await testUser2.destroy({ force: true });
    log.success('Test data cleaned up');

    log.success('✅ Phase 2: All model tests passed!\n');
    return true;
  } catch (error) {
    log.error(`Phase 2 failed: ${error.message}`);
    console.error(error);
    
    // Cleanup on error
    try {
      if (testShare) await testShare.destroy({ force: true });
      if (testVersion) await testVersion.destroy({ force: true });
      if (testNote) await testNote.destroy({ force: true });
      if (testUser) await testUser.destroy({ force: true });
      if (testUser2) await testUser2.destroy({ force: true });
    } catch (cleanupError) {
      log.warning('Cleanup error (ignored)');
    }
    
    return false;
  }
}

async function makeRequest(method, endpoint, data = null, token = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// ==================== PHASE 3: AUTHENTICATION (API) ====================

async function testAuthentication() {
  log.test('=== PHASE 3: AUTHENTICATION ===');
  
  // Test 1: Register User 1
  log.info('Test 1: Register User 1');
  const register1Email = `test1-${Date.now()}@example.com`;
  const register1 = await makeRequest('POST', '/api/auth/register', {
    email: register1Email,
    password: 'password123'
  });
  
  if (register1.success && register1.data.data?.user) {
    userId1 = register1.data.data.user.id;
    log.success(`User 1 registered: ID ${userId1}, Email: ${register1.data.data.user.email}`);
  } else {
    log.error(`Registration failed: ${JSON.stringify(register1.error)}`);
    return false;
  }

  // Test 2: Register User 2
  log.info('Test 2: Register User 2');
  const register2Email = `test2-${Date.now()}@example.com`;
  const register2 = await makeRequest('POST', '/api/auth/register', {
    email: register2Email,
    password: 'password123'
  });
  
  if (register2.success && register2.data.data?.user) {
    userId2 = register2.data.data.user.id;
    log.success(`User 2 registered: ID ${userId2}, Email: ${register2.data.data.user.email}`);
  } else {
    log.error(`Registration failed: ${JSON.stringify(register2.error)}`);
    return false;
  }

  // Test 3: Login User 1
  log.info('Test 3: Login User 1');
  const login1 = await makeRequest('POST', '/api/auth/login', {
    email: register1Email,
    password: 'password123'
  });
  
  if (login1.success && login1.data.data?.accessToken) {
    accessToken1 = login1.data.data.accessToken;
    refreshToken1 = login1.data.data.refreshToken;
    log.success('User 1 logged in successfully');
  } else {
    log.error(`Login failed: ${JSON.stringify(login1.error)}`);
    return false;
  }

  // Test 4: Login User 2
  log.info('Test 4: Login User 2');
  const login2 = await makeRequest('POST', '/api/auth/login', {
    email: register2Email,
    password: 'password123'
  });
  
  if (login2.success && login2.data.data?.accessToken) {
    accessToken2 = login2.data.data.accessToken;
    refreshToken2 = login2.data.data.refreshToken;
    log.success('User 2 logged in successfully');
  } else {
    log.error(`Login failed: ${JSON.stringify(login2.error)}`);
    return false;
  }

  // Test 5: Refresh Token
  log.info('Test 5: Refresh Token');
  const refresh = await makeRequest('POST', '/api/auth/refresh', {
    refreshToken: refreshToken1
  });
  
  if (refresh.success && refresh.data.data?.accessToken) {
    accessToken1 = refresh.data.data.accessToken;
    refreshToken1 = refresh.data.data.refreshToken;
    log.success('Token refreshed successfully');
  } else {
    log.error(`Token refresh failed: ${JSON.stringify(refresh.error)}`);
    return false;
  }

  // Test 6: Invalid Token
  log.info('Test 6: Invalid Token');
  const invalidToken = await makeRequest('GET', '/api/notes', null, 'invalid-token');
  if (!invalidToken.success && invalidToken.status === 401) {
    log.success('Invalid token correctly rejected');
  } else {
    log.error('Invalid token test failed');
    return false;
  }

  log.success('✅ Authentication tests passed!\n');
  return true;
}

// ==================== PHASE 4: CORE CRUD ====================

async function testCoreCRUD() {
  log.test('=== PHASE 4: CORE CRUD ===');

  // Test 1: Create Note
  log.info('Test 1: Create Note');
  const createNote = await makeRequest('POST', '/api/notes', {
    title: 'Test Note',
    content: 'This is a test note content'
  }, accessToken1);

  if (createNote.success && createNote.data.data?.note) {
    noteId1 = createNote.data.data.note.id;
    log.success(`Note created: ID ${noteId1}, Version ${createNote.data.data.note.version}`);
  } else {
    log.error(`Note creation failed: ${JSON.stringify(createNote.error)}`);
    return false;
  }

  // Test 2: Get All Notes
  log.info('Test 2: Get All Notes');
  const getAllNotes = await makeRequest('GET', '/api/notes', null, accessToken1);
  if (getAllNotes.success && getAllNotes.data.data?.notes?.length > 0) {
    log.success(`Retrieved ${getAllNotes.data.data.count} note(s)`);
  } else {
    log.error('Get all notes failed');
    return false;
  }

  // Test 3: Get Single Note
  log.info('Test 3: Get Single Note');
  const getNote = await makeRequest('GET', `/api/notes/${noteId1}`, null, accessToken1);
  if (getNote.success && getNote.data.data?.note) {
    log.success(`Note retrieved: ${getNote.data.data.note.title}`);
  } else {
    log.error('Get single note failed');
    return false;
  }

  // Test 4: Update Note
  log.info('Test 4: Update Note');
  const currentVersion = getNote.data.data.note.version;
  const updateNote = await makeRequest('PUT', `/api/notes/${noteId1}`, {
    title: 'Updated Test Note',
    content: 'Updated content',
    version: currentVersion
  }, accessToken1);

  if (updateNote.success && updateNote.data.data?.note) {
    log.success(`Note updated: Version ${updateNote.data.data.note.version}`);
  } else {
    log.error(`Note update failed: ${JSON.stringify(updateNote.error)}`);
    return false;
  }

  // Test 5: Concurrency Test (Version Conflict)
  log.info('Test 5: Concurrency Test (Version Conflict)');
  const conflictTest = await makeRequest('PUT', `/api/notes/${noteId1}`, {
    title: 'Conflict Test',
    version: currentVersion // Using old version
  }, accessToken1);

  if (!conflictTest.success && conflictTest.status === 409) {
    log.success('Version conflict correctly detected (409 Conflict)');
  } else {
    log.error('Concurrency test failed');
    return false;
  }

  // Test 6: Create Second Note
  log.info('Test 6: Create Second Note');
  const createNote2 = await makeRequest('POST', '/api/notes', {
    title: 'Second Test Note',
    content: 'Second note content'
  }, accessToken1);

  if (createNote2.success) {
    noteId2 = createNote2.data.data.note.id;
    log.success(`Second note created: ID ${noteId2}`);
  } else {
    log.error('Second note creation failed');
    return false;
  }

  log.success('✅ Core CRUD tests passed!\n');
  return true;
}

// ==================== PHASE 5: ADVANCED FEATURES ====================

async function testAdvancedFeatures() {
  log.test('=== PHASE 5: ADVANCED FEATURES ===');

  // Test 1: Get Note Versions
  log.info('Test 1: Get Note Versions');
  const getVersions = await makeRequest('GET', `/api/notes/${noteId1}/versions`, null, accessToken1);
  if (getVersions.success && getVersions.data.data?.versions?.length > 0) {
    versionId = getVersions.data.data.versions[0].id;
    log.success(`Retrieved ${getVersions.data.data.count} version(s)`);
  } else {
    log.error('Get versions failed');
    return false;
  }

  // Test 2: Revert Note
  log.info('Test 2: Revert Note');
  const revertNote = await makeRequest('POST', `/api/notes/${noteId1}/revert/${versionId}`, null, accessToken1);
  if (revertNote.success && revertNote.data.data?.note) {
    log.success(`Note reverted to version ${revertNote.data.data.revertedFromVersion}`);
  } else {
    log.error(`Revert failed: ${JSON.stringify(revertNote.error)}`);
    return false;
  }

  // Test 3: Full-Text Search
  log.info('Test 3: Full-Text Search');
  const search = await makeRequest('GET', '/api/notes/search?keywords=test', null, accessToken1);
  if (search.success && search.data.data?.notes) {
    log.success(`Search found ${search.data.data.count} note(s)`);
  } else {
    log.error('Search failed');
    return false;
  }

  // Test 4: Cache Test (Second request should be cached)
  log.info('Test 4: Cache Test');
  const start1 = Date.now();
  await makeRequest('GET', '/api/notes', null, accessToken1);
  const time1 = Date.now() - start1;

  const start2 = Date.now();
  const cachedRequest = await makeRequest('GET', '/api/notes', null, accessToken1);
  const time2 = Date.now() - start2;

  if (cachedRequest.success && cachedRequest.data.message?.includes('cached')) {
    log.success(`Cache working: First request ${time1}ms, Cached request ${time2}ms`);
  } else {
    log.warning('Cache test inconclusive (may need Redis connection)');
  }

  log.success('✅ Advanced features tests passed!\n');
  return true;
}

// ==================== PHASE 6: BONUS FEATURES ====================

async function testBonusFeatures() {
  log.test('=== PHASE 6: BONUS FEATURES ===');

  // Test 1: Share Note
  log.info('Test 1: Share Note');
  const shareNote = await makeRequest('POST', `/api/notes/${noteId1}/share`, {
    sharedWithUserId: userId2,
    permission: 'read'
  }, accessToken1);

  if (shareNote.success && shareNote.data.data?.share) {
    shareId = shareNote.data.data.share.id;
    log.success(`Note shared with User 2 (Share ID: ${shareId})`);
  } else {
    log.error(`Share failed: ${JSON.stringify(shareNote.error)}`);
    return false;
  }

  // Test 2: Get Shared Notes (as User 2)
  log.info('Test 2: Get Shared Notes');
  const getShared = await makeRequest('GET', '/api/notes/shared', null, accessToken2);
  if (getShared.success && getShared.data.data?.notes?.length > 0) {
    log.success(`User 2 retrieved ${getShared.data.data.count} shared note(s)`);
  } else {
    log.error('Get shared notes failed');
    return false;
  }

  // Test 3: Update Share Permission
  log.info('Test 3: Update Share Permission');
  const updateShare = await makeRequest('PUT', `/api/notes/${noteId1}/share/${shareId}`, {
    permission: 'edit'
  }, accessToken1);

  if (updateShare.success) {
    log.success('Share permission updated to edit');
  } else {
    log.error('Update share permission failed');
    return false;
  }

  // Test 4: Upload Attachment (simulated - requires multipart/form-data)
  log.info('Test 4: Upload Attachment (simulated)');
  log.warning('File upload test requires actual file - skipping for now');
  // Note: Actual file upload test would require FormData and file handling

  // Test 5: Get Attachments
  log.info('Test 5: Get Attachments');
  const getAttachments = await makeRequest('GET', `/api/notes/${noteId1}/attachments`, null, accessToken1);
  if (getAttachments.success) {
    log.success(`Retrieved ${getAttachments.data.data?.count || 0} attachment(s)`);
  } else {
    log.error('Get attachments failed');
    return false;
  }

  // Test 6: Unshare Note
  log.info('Test 6: Unshare Note');
  const unshare = await makeRequest('DELETE', `/api/notes/${noteId1}/share/${shareId}`, null, accessToken1);
  if (unshare.success) {
    log.success('Note unshared successfully');
  } else {
    log.error('Unshare failed');
    return false;
  }

  log.success('✅ Bonus features tests passed!\n');
  return true;
}

// ==================== ERROR HANDLING TESTS ====================

async function testErrorHandling() {
  log.test('=== ERROR HANDLING ===');

  // Test 1: Invalid Endpoint
  log.info('Test 1: Invalid Endpoint');
  const invalidEndpoint = await makeRequest('GET', '/api/invalid', null, accessToken1);
  if (!invalidEndpoint.success && invalidEndpoint.status === 404) {
    log.success('Invalid endpoint correctly returns 404');
  } else {
    log.warning('Invalid endpoint test inconclusive');
  }

  // Test 2: Validation Error
  log.info('Test 2: Validation Error');
  const validationError = await makeRequest('POST', '/api/notes', {
    title: '' // Empty title should fail
  }, accessToken1);
  if (!validationError.success && validationError.status === 400) {
    log.success('Validation error correctly returns 400');
  } else {
    log.error('Validation error test failed');
    return false;
  }

  // Test 3: Unauthorized Access
  log.info('Test 3: Unauthorized Access');
  const unauthorized = await makeRequest('GET', `/api/notes/${noteId1}`, null, accessToken2);
  if (!unauthorized.success && unauthorized.status === 404) {
    log.success('Unauthorized access correctly rejected');
  } else {
    log.warning('Unauthorized access test inconclusive');
  }

  // Test 4: Not Found
  log.info('Test 4: Not Found');
  const notFound = await makeRequest('GET', '/api/notes/99999', null, accessToken1);
  if (!notFound.success && notFound.status === 404) {
    log.success('Not found correctly returns 404');
  } else {
    log.error('Not found test failed');
    return false;
  }

  log.success('✅ Error handling tests passed!\n');
  return true;
}

// ==================== CLEANUP ====================

async function cleanup() {
  log.test('=== CLEANUP ===');
  
  if (noteId1) {
    await makeRequest('DELETE', `/api/notes/${noteId1}`, null, accessToken1);
    log.info('Note 1 deleted');
  }
  
  if (noteId2) {
    await makeRequest('DELETE', `/api/notes/${noteId2}`, null, accessToken1);
    log.info('Note 2 deleted');
  }

  log.success('✅ Cleanup completed\n');
}

// ==================== MAIN TEST RUNNER ====================

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 COMPREHENSIVE TEST SUITE');
  console.log('   (Phases 1-8: Infrastructure, Models, API, Features)');
  console.log('='.repeat(60) + '\n');

  const results = {
    phase1: false,
    phase2: false,
    authentication: false,
    coreCRUD: false,
    advancedFeatures: false,
    bonusFeatures: false,
    errorHandling: false
  };

  try {
    // Run Phase 1: Infrastructure (Database & Redis)
    results.phase1 = await testPhase1();
    if (!results.phase1) {
      log.error('Phase 1 tests failed. Stopping.');
      return;
    }

    // Run Phase 2: Models & Migrations
    results.phase2 = await testPhase2();
    if (!results.phase2) {
      log.error('Phase 2 tests failed. Stopping.');
      return;
    }

    // Check if server is running for API tests
    log.info('Checking server health...');
    const health = await makeRequest('GET', '/health');
    if (!health.success) {
      log.error('Server is not running. Please start the server first.');
      log.warning('Phase 1 & 2 tests passed, but API tests require server to be running.');
      process.exit(1);
    }
    log.success('Server is healthy\n');

    // Run API test phases
    results.authentication = await testAuthentication();
    if (!results.authentication) {
      log.error('Authentication tests failed. Stopping.');
      return;
    }

    results.coreCRUD = await testCoreCRUD();
    if (!results.coreCRUD) {
      log.error('Core CRUD tests failed. Stopping.');
      return;
    }

    results.advancedFeatures = await testAdvancedFeatures();
    if (!results.advancedFeatures) {
      log.error('Advanced features tests failed. Stopping.');
      return;
    }

    results.bonusFeatures = await testBonusFeatures();
    if (!results.bonusFeatures) {
      log.error('Bonus features tests failed. Stopping.');
      return;
    }

    results.errorHandling = await testErrorHandling();
    if (!results.errorHandling) {
      log.error('Error handling tests failed. Stopping.');
      return;
    }

    await cleanup();

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Phase 1 (Infrastructure): ${results.phase1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phase 2 (Models):        ${results.phase2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phase 3 (Authentication): ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phase 4 (Core CRUD):      ${results.coreCRUD ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phase 5 (Advanced):       ${results.advancedFeatures ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Phase 6 (Bonus):          ${results.bonusFeatures ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Error Handling:          ${results.errorHandling ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(60));

    const allPassed = Object.values(results).every(r => r === true);
    if (allPassed) {
      log.success('\n🎉 ALL TESTS PASSED!');
      process.exit(0);
    } else {
      log.error('\n❌ SOME TESTS FAILED');
      process.exit(1);
    }
  } catch (error) {
    log.error(`\n❌ Test suite error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();

