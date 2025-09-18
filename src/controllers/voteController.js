import prisma from '../config/database.js';

// Submit a vote
export const submitVote = async (req, res, io) => {
  try {
    const { pollOptionId } = req.body;

    if (!pollOptionId) {
      return res.status(400).json({ error: 'Poll option ID is required' });
    }

    // Check if poll option exists and get poll info
    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: {
        poll: {
          select: {
            id: true,
            isPublished: true,
            question: true
          }
        }
      }
    });

    if (!pollOption) {
      return res.status(404).json({ error: 'Poll option not found' });
    }

    if (!pollOption.poll.isPublished) {
      return res.status(403).json({ error: 'Cannot vote on unpublished poll' });
    }

    // Check if user has already voted for any option in this poll
    const existingVoteInPoll = await prisma.vote.findFirst({
      where: {
        userId: req.user.id,
        pollOption: {
          pollId: pollOption.poll.id
        }
      }
    });

    if (existingVoteInPoll) {
      return res.status(409).json({ 
        error: 'You have already voted in this poll' 
      });
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        userId: req.user.id,
        pollOptionId
      },
      include: {
        user: {
          select: { id: true, name: true }
        },
        pollOption: {
          include: {
            poll: {
              select: { id: true, question: true }
            }
          }
        }
      }
    });

    // Get updated poll results
    const updatedPollResults = await _getPollResultsInternal(pollOption.poll.id);

    // Emit real-time update to all clients viewing this poll
    io.to(`poll-${pollOption.poll.id}`).emit('pollUpdate', {
      pollId: pollOption.poll.id,
      results: updatedPollResults
    });

    res.status(201).json({
      message: 'Vote submitted successfully',
      vote: {
        id: vote.id,
        createdAt: vote.createdAt,
        user: vote.user,
        pollOption: vote.pollOption
      }
    });
  } catch (error) {
    // Handle unique constraint violation (duplicate vote)
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        error: 'You have already voted for this option' 
      });
    }
    
    console.error('Submit vote error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get poll results (helper function)
const _getPollResultsInternal = async (pollId) => {
  const results = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        include: {
          _count: {
            select: { votes: true }
          }
        }
      }
    }
  });

  if (!results) {
    return null;
  }

  const totalVotes = results.options.reduce((sum, option) => 
    sum + option._count.votes, 0
  );

  return {
    pollId: results.id,
    question: results.question,
    totalVotes,
    options: results.options.map(option => ({
      id: option.id,
      text: option.text,
      voteCount: option._count.votes,
      percentage: totalVotes > 0 ? 
        Math.round((option._count.votes / totalVotes) * 100) : 0
    }))
  };
};

// Get poll results endpoint
export const getPollResults = async (req, res) => {
  try {
    const { pollId } = req.params;

    const results = await _getPollResultsInternal(pollId);

    if (!results) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ results });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's votes
export const getUserVotes = async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      where: { userId: req.user.id },
      include: {
        pollOption: {
          include: {
            poll: {
              select: {
                id: true,
                question: true,
                isPublished: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ votes });
  } catch (error) {
    console.error('Get user votes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};