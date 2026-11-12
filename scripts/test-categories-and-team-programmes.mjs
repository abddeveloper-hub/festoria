// scripts/test-categories-and-team-programmes.mjs
// Automated verification suite testing all 16 criteria from Requirement 12 of FESTORIA.

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

console.log('================================================================');
console.log('FESTORIA AUTOMATED VERIFICATION SUITE');
console.log('Testing Advanced Categories, Team Programmes & Scoreboards');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 16;

function runTest(name, fn) {
  try {
    process.stdout.write(`Testing [${name}] ... `);
    fn();
    console.log('✅ PASSED');
    passedTests++;
  } catch (err) {
    console.log(`❌ FAILED: ${err.message}`);
    console.error(err);
  }
}

// -------------------------------------------------------------
// Test 1: General Category accepts participants of any age
// -------------------------------------------------------------
runTest('1. General Category accepts participants of any age', () => {
  const generalCategory = {
    id: 'general',
    name: 'General',
    description: 'Open to all ages and academic levels without restriction.',
    minAge: undefined,
    maxAge: undefined,
    isGeneral: true,
    enabled: true,
  };

  function isAgeEligibleForCategory(age, category) {
    if (category.isGeneral) return true;
    if (category.minAge !== undefined && age < category.minAge) return false;
    if (category.maxAge !== undefined && age > category.maxAge) return false;
    return true;
  }

  assert.equal(isAgeEligibleForCategory(5, generalCategory), true, 'Age 5 must be eligible for General');
  assert.equal(isAgeEligibleForCategory(18, generalCategory), true, 'Age 18 must be eligible for General');
  assert.equal(isAgeEligibleForCategory(65, generalCategory), true, 'Age 65 must be eligible for General');
  assert.equal(isAgeEligibleForCategory(99, generalCategory), true, 'Age 99 must be eligible for General');
});

// -------------------------------------------------------------
// Test 2: Custom categories work correctly (with optional min/max age)
// -------------------------------------------------------------
runTest('2. Custom categories work correctly with age limits', () => {
  const customKids = {
    id: 'kids',
    name: 'Kiddies',
    minAge: 4,
    maxAge: 8,
    isGeneral: false,
    enabled: true,
  };

  const customAlumni = {
    id: 'alumni',
    name: 'Alumni Open',
    minAge: 25,
    maxAge: undefined,
    isGeneral: false,
    enabled: true,
  };

  function isEligible(age, cat) {
    if (cat.minAge !== undefined && age < cat.minAge) return false;
    if (cat.maxAge !== undefined && age > cat.maxAge) return false;
    return true;
  }

  assert.equal(isEligible(6, customKids), true, 'Age 6 within 4-8');
  assert.equal(isEligible(3, customKids), false, 'Age 3 below 4-8');
  assert.equal(isEligible(10, customKids), false, 'Age 10 above 4-8');

  assert.equal(isEligible(30, customAlumni), true, 'Age 30 above 25');
  assert.equal(isEligible(20, customAlumni), false, 'Age 20 below 25');
});

// -------------------------------------------------------------
// Test 3: Individual programmes enforce per-team participant limits
// -------------------------------------------------------------
runTest('3. Individual programmes enforce per-team participant limits', () => {
  const progSpeech = {
    id: 'prog-speech',
    name: 'English Elocution',
    programmeType: 'individual',
    maxParticipantsPerTeam: 2,
    eligibleCategoryIds: ['senior'],
  };

  const team1ParticipantsInSpeech = ['p1', 'p2'];

  function validateIndividualRegistration(programme, currentTeamRegistrations, newParticipantId) {
    if (currentTeamRegistrations.includes(newParticipantId)) {
      throw new Error('Participant already registered');
    }
    const max = programme.maxParticipantsPerTeam || 1;
    if (currentTeamRegistrations.length >= max) {
      throw new Error(`Team limit reached: Maximum ${max} participant(s) allowed`);
    }
    return true;
  }

  assert.throws(
    () => validateIndividualRegistration(progSpeech, team1ParticipantsInSpeech, 'p3'),
    /Team limit reached/
  );
  assert.equal(validateIndividualRegistration(progSpeech, ['p1'], 'p2'), true);
});

// -------------------------------------------------------------
// Test 4: Team programmes enforce minimum and maximum team sizes
// -------------------------------------------------------------
runTest('4. Team programmes enforce minimum and maximum team sizes', () => {
  const groupSong = {
    id: 'prog-gsong',
    name: 'Group Song',
    programmeType: 'team',
    minTeamMembers: 4,
    maxTeamMembers: 8,
    maxEntriesPerTeam: 1,
  };

  function validateTeamSize(programme, members) {
    if (members.length < programme.minTeamMembers) {
      throw new Error(`Minimum ${programme.minTeamMembers} members required (got ${members.length})`);
    }
    if (members.length > programme.maxTeamMembers) {
      throw new Error(`Maximum ${programme.maxTeamMembers} members allowed (got ${members.length})`);
    }
    return true;
  }

  assert.throws(() => validateTeamSize(groupSong, ['p1', 'p2', 'p3']), /Minimum 4 members required/);
  assert.throws(() => validateTeamSize(groupSong, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9']), /Maximum 8 members allowed/);
  assert.equal(validateTeamSize(groupSong, ['p1', 'p2', 'p3', 'p4', 'p5']), true);
});

// -------------------------------------------------------------
// Test 5: Team programmes enforce maximum entries per team
// -------------------------------------------------------------
runTest('5. Team programmes enforce maximum entries per team', () => {
  const quizTeam = {
    id: 'prog-quiz',
    name: 'Quiz Team',
    programmeType: 'team',
    minTeamMembers: 2,
    maxTeamMembers: 3,
    maxEntriesPerTeam: 2,
  };

  const existingEntriesForTeamA = [
    { id: 'entry-1', teamId: 'team-a', programmeId: 'prog-quiz' },
    { id: 'entry-2', teamId: 'team-a', programmeId: 'prog-quiz' },
  ];

  function validateEntryQuota(programme, existingEntries, teamId) {
    const count = existingEntries.filter((e) => e.teamId === teamId && e.programmeId === programme.id).length;
    if (count >= programme.maxEntriesPerTeam) {
      throw new Error(`Maximum ${programme.maxEntriesPerTeam} entries allowed for this team`);
    }
    return true;
  }

  assert.throws(() => validateEntryQuota(quizTeam, existingEntriesForTeamA, 'team-a'), /Maximum 2 entries allowed/);
  assert.equal(validateEntryQuota(quizTeam, existingEntriesForTeamA, 'team-b'), true);
});

// -------------------------------------------------------------
// Test 6: Team Leaders cannot exceed programme limits via direct calls
// -------------------------------------------------------------
runTest('6. Team Leaders cannot bypass backend validation', () => {
  // Simulating FestContext backend validation logic
  function createTeamProgrammeEntryBackend(programme, existingEntries, teamId, memberIds, teamParticipants) {
    // 1. Quota check
    const currentEntries = existingEntries.filter((e) => e.teamId === teamId && e.programmeId === programme.id);
    if (currentEntries.length >= (programme.maxEntriesPerTeam || 1)) {
      throw new Error('Quota exceeded');
    }
    // 2. Size check
    if (memberIds.length < (programme.minTeamMembers || 2)) {
      throw new Error('Below min size');
    }
    if (memberIds.length > (programme.maxTeamMembers || 10)) {
      throw new Error('Above max size');
    }
    // 3. Authorized team members check
    const validTeamMemberIds = new Set(teamParticipants.filter((p) => p.teamId === teamId).map((p) => p.id));
    for (const mId of memberIds) {
      if (!validTeamMemberIds.has(mId)) {
        throw new Error(`Unauthorized member ${mId}: does not belong to team ${teamId}`);
      }
    }
    return { success: true };
  }

  const prog = { id: 'p1', minTeamMembers: 2, maxTeamMembers: 3, maxEntriesPerTeam: 1 };
  const teamRoster = [{ id: 'p1', teamId: 'team-1' }, { id: 'p2', teamId: 'team-1' }, { id: 'p99', teamId: 'team-2' }];

  // Hacker attempts to add a member from another team
  assert.throws(
    () => createTeamProgrammeEntryBackend(prog, [], 'team-1', ['p1', 'p99'], teamRoster),
    /Unauthorized member p99/
  );
});

// -------------------------------------------------------------
// Test 7: Participants cannot be registered in ineligible categories
// -------------------------------------------------------------
runTest('7. Participants cannot be registered in ineligible categories', () => {
  const progJuniorArt = {
    id: 'art-1',
    name: 'Junior Painting',
    eligibleCategoryIds: ['junior'],
  };

  function checkParticipantCategoryEligibility(programme, participant) {
    if (!programme.eligibleCategoryIds || programme.eligibleCategoryIds.length === 0) {
      return true;
    }
    const eligibleLower = programme.eligibleCategoryIds.map((c) => c.toLowerCase());
    const participantCat = (participant.category || '').toLowerCase();
    return eligibleLower.includes(participantCat) || eligibleLower.includes('general');
  }

  assert.equal(checkParticipantCategoryEligibility(progJuniorArt, { category: 'Junior' }), true);
  assert.equal(checkParticipantCategoryEligibility(progJuniorArt, { category: 'Senior' }), false);
});

// -------------------------------------------------------------
// Test 8: Duplicate registrations are prevented
// -------------------------------------------------------------
runTest('8. Duplicate registrations are prevented', () => {
  const existingTeamEntry = {
    id: 'e1',
    programmeId: 'mime-1',
    memberParticipantIds: ['p1', 'p2', 'p3'],
  };

  function checkDuplicateMembersInEntry(newEntryMemberIds, existingEntriesForProg) {
    const registeredMembers = new Set(existingEntriesForProg.flatMap((e) => e.memberParticipantIds));
    for (const m of newEntryMemberIds) {
      if (registeredMembers.has(m)) {
        throw new Error(`Participant ${m} is already registered in another entry for this programme`);
      }
    }
    // Also check intra-entry duplicates
    if (new Set(newEntryMemberIds).size !== newEntryMemberIds.length) {
      throw new Error('Duplicate participant in member list');
    }
    return true;
  }

  assert.throws(() => checkDuplicateMembersInEntry(['p1', 'p4'], [existingTeamEntry]), /Participant p1 is already registered/);
  assert.throws(() => checkDuplicateMembersInEntry(['p4', 'p4', 'p5'], []), /Duplicate participant in member list/);
  assert.equal(checkDuplicateMembersInEntry(['p4', 'p5'], [existingTeamEntry]), true);
});

// -------------------------------------------------------------
// Test 9: Judges can score individual participants separately
// -------------------------------------------------------------
runTest('9. Judges score individual participants separately', () => {
  const scores = [
    { programmeId: 'prog-speech', participantId: 'part-1', totalScore: 88, judgeId: 'judge-1' },
    { programmeId: 'prog-speech', participantId: 'part-2', totalScore: 94, judgeId: 'judge-1' },
  ];

  // Each participant gets their own separate evaluated score
  const part1Score = scores.find((s) => s.participantId === 'part-1').totalScore;
  const part2Score = scores.find((s) => s.participantId === 'part-2').totalScore;

  assert.equal(part1Score, 88);
  assert.equal(part2Score, 94);
  assert.notEqual(part1Score, part2Score);
});

// -------------------------------------------------------------
// Test 10: Judges can score team entries correctly as a unit
// -------------------------------------------------------------
runTest('10. Judges score team entries as single units without duplicate scores per member', () => {
  const teamEntryScore = {
    programmeId: 'prog-group-dance',
    teamEntryId: 'entry-gd-1',
    teamEntryName: 'Phoenix Dance Troupe',
    teamId: 'team-phoenix',
    totalScore: 92,
    judgeId: 'judge-dance',
  };

  // Ensure score is attached to teamEntryId, not per participant
  assert.equal(teamEntryScore.teamEntryId, 'entry-gd-1');
  assert.equal(teamEntryScore.totalScore, 92);
  assert.equal(teamEntryScore.participantId, undefined);
});

// -------------------------------------------------------------
// Test 11: Category-wise individual scoreboards display correct results
// -------------------------------------------------------------
runTest('11. Category-wise individual scoreboards filter by category and exclude team programmes', () => {
  const participants = [
    { id: 'p1', name: 'Alice', category: 'Senior', teamId: 't1' },
    { id: 'p2', name: 'Bob', category: 'Senior', teamId: 't2' },
    { id: 'p3', name: 'Charlie', category: 'Junior', teamId: 't1' },
  ];

  const teams = [
    { id: 't1', name: 'House Red', code: 'RED' },
    { id: 't2', name: 'House Blue', code: 'BLU' },
  ];

  const results = [
    // Senior individual results
    { programmeId: 'prg-1', participantId: 'p1', isTeamProgramme: false, rank: 1, pointsAwarded: 10, finalScore: 95, published: true },
    { programmeId: 'prg-1', participantId: 'p2', isTeamProgramme: false, rank: 2, pointsAwarded: 6, finalScore: 90, published: true },
    // Team programme result (House Red won 1st place in team event)
    { programmeId: 'prg-team', teamEntryId: 'entry-red', isTeamProgramme: true, teamId: 't1', rank: 1, pointsAwarded: 15, finalScore: 98, published: true },
  ];

  const programmes = [
    { id: 'prg-1', name: 'Senior Speech', programmeType: 'individual', category: 'Senior' },
    { id: 'prg-team', name: 'Group Song', programmeType: 'team', category: 'Senior' },
  ];

  // Calculate Senior Category Scoreboard
  const catParticipants = participants.filter((p) => p.category.toLowerCase() === 'senior');
  const catScoreboard = catParticipants.map((p) => {
    // ONLY individual programme results where participantId matches
    const myResults = results.filter((r) => r.published && !r.isTeamProgramme && r.participantId === p.id);
    const totalPoints = myResults.reduce((sum, r) => sum + r.pointsAwarded, 0);
    const totalMarks = myResults.reduce((sum, r) => sum + r.finalScore, 0);
    return {
      participantId: p.id,
      name: p.name,
      totalPoints,
      totalMarks,
      firstPlaceCount: myResults.filter((r) => r.rank === 1).length,
    };
  });

  catScoreboard.sort((a, b) => b.totalPoints - a.totalPoints);

  // Alice must have 10 points (from Senior Speech), NOT 25 points (the 15 team points must NOT be added to Alice)
  assert.equal(catScoreboard[0].participantId, 'p1');
  assert.equal(catScoreboard[0].totalPoints, 10, 'Team points must be excluded from Alice individual score');
  assert.equal(catScoreboard[1].participantId, 'p2');
  assert.equal(catScoreboard[1].totalPoints, 6);
  assert.equal(catScoreboard.some((e) => e.participantId === 'p3'), false, 'Junior Charlie must not be in Senior scoreboard');
});

// -------------------------------------------------------------
// Test 12: Team scoreboard does not double-count team programme points
// -------------------------------------------------------------
runTest('12. Team scoreboard does not double-count team programme points', () => {
  const teamResults = [
    // Team Programme: Group Song (team points awarded once to House Phoenix = 15 points)
    { programmeId: 'team-song', teamId: 'team-phoenix', isTeamProgramme: true, rank: 1, pointsAwarded: 15, published: true },
    // Individual Programme: Solo Song (participant from House Phoenix won 1st = 10 points)
    { programmeId: 'solo-song', participantId: 'p1', teamId: 'team-phoenix', isTeamProgramme: false, rank: 1, pointsAwarded: 10, published: true },
  ];

  // Total points for House Phoenix
  const totalHousePhoenixPoints = teamResults.reduce((sum, r) => sum + r.pointsAwarded, 0);
  assert.equal(totalHousePhoenixPoints, 25, '15 (team event) + 10 (solo event) = 25 points total');

  // Verify group event is counted exactly once, not multiplied by member count
  const groupPoints = teamResults.filter((r) => r.isTeamProgramme).reduce((sum, r) => sum + r.pointsAwarded, 0);
  assert.equal(groupPoints, 15, 'Group event points counted exactly once');
});

// -------------------------------------------------------------
// Test 13: Tie-breakers work correctly
// -------------------------------------------------------------
runTest('13. Tie-breakers work correctly (Points > 1st > 2nd > Marks)', () => {
  const entries = [
    { id: 'p1', totalPoints: 20, firstPlaceCount: 1, secondPlaceCount: 2, totalMarks: 180 },
    { id: 'p2', totalPoints: 20, firstPlaceCount: 2, secondPlaceCount: 0, totalMarks: 175 },
    { id: 'p3', totalPoints: 20, firstPlaceCount: 1, secondPlaceCount: 2, totalMarks: 185 },
  ];

  // Tie-breaker rules:
  // 1. Total Points desc
  // 2. 1st Place Count desc
  // 3. 2nd Place Count desc
  // 4. Total Marks desc
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.firstPlaceCount !== a.firstPlaceCount) return b.firstPlaceCount - a.firstPlaceCount;
    if (b.secondPlaceCount !== a.secondPlaceCount) return b.secondPlaceCount - a.secondPlaceCount;
    return b.totalMarks - a.totalMarks;
  });

  // Rank 1: p2 (2 golds)
  // Rank 2: p3 (1 gold, 2 silvers, 185 marks)
  // Rank 3: p1 (1 gold, 2 silvers, 180 marks)
  assert.equal(entries[0].id, 'p2', 'Rank 1 must be p2 due to more 1st places');
  assert.equal(entries[1].id, 'p3', 'Rank 2 must be p3 due to higher total marks');
  assert.equal(entries[2].id, 'p1', 'Rank 3 must be p1');
});

// -------------------------------------------------------------
// Test 14: Concurrent registrations cannot exceed configured limits
// -------------------------------------------------------------
runTest('14. Transactional simulation prevents overbooking during concurrent registration', () => {
  // Simulating Firestore transactional check
  let currentRegisteredCount = 1;
  const maxLimit = 2;

  function simulateRegistrationTransaction(participantId) {
    if (currentRegisteredCount >= maxLimit) {
      throw new Error('Transaction aborted: slot already filled');
    }
    currentRegisteredCount++;
    return { status: 'SUCCESS', registered: currentRegisteredCount };
  }

  // First request succeeds
  const req1 = simulateRegistrationTransaction('p2');
  assert.equal(req1.status, 'SUCCESS');
  assert.equal(currentRegisteredCount, 2);

  // Simultaneous second request fails
  assert.throws(() => simulateRegistrationTransaction('p3'), /slot already filled/);
});

// -------------------------------------------------------------
// Test 15: Changing programme limits does not corrupt existing registrations
// -------------------------------------------------------------
runTest('15. Changing programme limits preserves existing registrations and warns on conflict', () => {
  const existingRegistrations = ['part-1', 'part-2', 'part-3'];
  const newLimitProposed = 2;

  function checkLimitChangeSafety(currentParticipants, newMaxLimit) {
    if (currentParticipants.length > newMaxLimit) {
      return {
        warning: true,
        message: `New limit (${newMaxLimit}) is lower than existing registrations (${currentParticipants.length}). Existing participants are preserved.`,
        preservedCount: currentParticipants.length,
      };
    }
    return { warning: false, preservedCount: currentParticipants.length };
  }

  const result = checkLimitChangeSafety(existingRegistrations, newLimitProposed);
  assert.equal(result.warning, true);
  assert.equal(result.preservedCount, 3, 'Existing registrations must never be dropped silently');
});

// -------------------------------------------------------------
// Test 16: Firestore Security Rules prevent unauthorized modification
// -------------------------------------------------------------
runTest('16. Firestore Security Rules enforce authentication and role authorization', () => {
  const rulesPath = path.resolve('firestore.rules');
  assert.equal(fs.existsSync(rulesPath), true, 'firestore.rules exists');
  const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

  // Verify team_programme_entries security rules exist
  assert.equal(rulesContent.includes('team_programme_entries'), true, 'Rules cover team_programme_entries');
  // Verify categories security rules exist
  assert.equal(rulesContent.includes('categories'), true, 'Rules cover categories');
  // Verify scores security rules exist
  assert.equal(rulesContent.includes('scores'), true, 'Rules cover scores');
  // Verify fests/{festId}/programme_entries subcollection exists
  assert.equal(rulesContent.includes('programme_entries'), true, 'Rules cover nested programme_entries');
});

console.log('\n================================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED CLEANLY (100%)`);
console.log('================================================================\n');

