import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    experience: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });

export default mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
