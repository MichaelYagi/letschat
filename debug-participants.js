const createdBy = 'user1';
const participantIds = ['user2', 'user3'];

const participants = [
  { userId: createdBy, role: 'admin' as const },
  ...participantIds
    .filter(userId => userId !== createdBy)
    .map(userId => ({
      userId,
      role: 'member' as const,
    })),
];

console.log('Debug - participants array:', participants);
console.log('User IDs:', participants.map(p => p.userId));