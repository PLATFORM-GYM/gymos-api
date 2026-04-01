const mongoose = require('mongoose');

const wompiSettingsSchema = new mongoose.Schema({
  publicKey: { type: String, trim: true, default: '' },
  privateKey: { type: String, trim: true, default: '' },
  eventsKey: { type: String, trim: true, default: '' },
  redirectUrl: { type: String, trim: true, default: '' },
}, { _id: false });

const platformSubscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['basic', 'pro', 'enterprise'],
    default: 'basic',
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending',
  },
  price: { type: Number, default: 50000 },
  startDate: { type: Date },
  endDate: { type: Date },
  wompiRef: { type: String, trim: true },
}, { _id: false });

const gymSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  tagline: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  address: {
    type: String,
  },
  logo: {
    type: String,
    trim: true,
  },
  coverImage: {
    type: String,
    trim: true,
  },
  contactPhone: {
    type: String,
  },
  email: {
    type: String,
  },
  website: {
    type: String,
  },
  salt: {
    type: String,
  },
  administrators: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    autopopulate: true,
  }],
  coaches: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Coach',
    autopopulate: true,
  }],
  clients: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Client',
    autopopulate: true,
  }],
  category: {
    type: String,
  },
  wompiSettings: {
    type: wompiSettingsSchema,
    default: () => ({}),
  },
  platformSubscription: {
    type: platformSubscriptionSchema,
    default: () => ({}),
  },
  rolePermissions: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      owner: { manageClients: true, manageSubscriptions: true, managePayments: true, manageSettings: true, manageEmployees: true, viewCalendar: true, manageCalendar: true },
      admin: { manageClients: true, manageSubscriptions: true, managePayments: true, manageSettings: false, manageEmployees: true, viewCalendar: true, manageCalendar: true },
      coach: { manageClients: false, manageSubscriptions: false, managePayments: false, manageSettings: false, manageEmployees: false, viewCalendar: true, manageCalendar: false },
      client: { manageClients: false, manageSubscriptions: false, managePayments: false, manageSettings: false, manageEmployees: false, viewCalendar: true, manageCalendar: false },
    },
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
  },
  source: String,
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

gymSchema.pre('save', function (next) {
  this.updated = Date.now();
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

gymSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Gym', gymSchema);
