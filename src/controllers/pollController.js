import prisma from '../config/database.js';

// Create a new poll
export const createPoll = async (req, res) => {
  try {
    const { question, options, isPublished = false } = req.body;

    // Validate input
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        error: 'Question and at least 2 options are required'
      });
    }

    // Create poll with options in a transaction
    const poll = await prisma.$transaction(async (tx) => {
      // Create the poll
      const newPoll = await tx.poll.create({
        data: {
          question,
          isPublished,
          userId: req.user.id
        }
      });

      // Create poll options
      const pollOptions = await tx.pollOption.createMany({
        data: options.map(optionText => ({
          text: optionText.trim(),
          pollId: newPoll.id
        }))
      });

      // Return poll with options
      return await tx.poll.findUnique({
        where: { id: newPoll.id },
        include: {
          options: true,
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });
    });

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all published polls
export const getAllPolls = async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { isPublished: true },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { options: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to include vote counts
    const pollsWithCounts = polls.map(poll => ({
      ...poll,
      options: poll.options.map(option => ({
        ...option,
        voteCount: option._count.votes
      }))
    }));

    res.json({ polls: pollsWithCounts });
  } catch (error) {
    console.error('Get all polls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a specific poll by ID
export const getPollById = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if poll is published or user is the creator
    if (!poll.isPublished && poll.userId !== req.user.id) {
      return res.status(403).json({ error: 'Poll is not published' });
    }

    // Transform to include vote counts
    const pollWithCounts = {
      ...poll,
      options: poll.options.map(option => ({
        ...option,
        voteCount: option._count.votes
      }))
    };

    res.json({ poll: pollWithCounts });
  } catch (error) {
    console.error('Get poll by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's polls
export const getUserPolls = async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      where: { userId: req.user.id },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        _count: {
          select: { options: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to include vote counts
    const pollsWithCounts = polls.map(poll => ({
      ...poll,
      options: poll.options.map(option => ({
        ...option,
        voteCount: option._count.votes
      }))
    }));

    res.json({ polls: pollsWithCounts });
  } catch (error) {
    console.error('Get user polls error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update poll (publish/unpublish)
export const updatePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { question, isPublished } = req.body;

    // Check if poll exists and belongs to user
    const existingPoll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!existingPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (existingPoll.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this poll' });
    }

    // Update poll
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: {
        ...(question && { question }),
        ...(typeof isPublished !== 'undefined' && { isPublished })
      },
      include: {
        options: {
          include: {
            _count: {
              select: { votes: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.json({
      message: 'Poll updated successfully',
      poll: {
        ...updatedPoll,
        options: updatedPoll.options.map(option => ({
          ...option,
          voteCount: option._count.votes
        }))
      }
    });
  } catch (error) {
    console.error('Update poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete poll
export const deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    // Check if poll exists and belongs to user
    const existingPoll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!existingPoll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (existingPoll.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this poll' });
    }

    // Delete poll (cascade will handle options and votes)
    await prisma.poll.delete({
      where: { id: pollId }
    });

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};