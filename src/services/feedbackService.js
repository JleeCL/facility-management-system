// feedbackService.js

const feedbacks = [];

// Create feedback
function createFeedback(feedback) {
    feedbacks.push(feedback);
    return feedback;
}

// Read all feedback
function readFeedbacks() {
    return feedbacks;
}

// Update feedback
function updateFeedback(index, updatedFeedback) {
    if (index < 0 || index >= feedbacks.length) {
        throw new Error('Feedback not found');
    }
    feedbacks[index] = updatedFeedback;
    return updatedFeedback;
}

// Delete feedback
function deleteFeedback(index) {
    if (index < 0 || index >= feedbacks.length) {
        throw new Error('Feedback not found');
    }
    return feedbacks.splice(index, 1);
}

module.exports = { createFeedback, readFeedbacks, updateFeedback, deleteFeedback };