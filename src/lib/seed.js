/**
 * Database Seed Script
 * Run: node --experimental-modules src/lib/seed.js
 * Or add to package.json scripts: "seed": "node --experimental-modules src/lib/seed.js"
 *
 * Seeds: admin user, system components, default theme config
 */

import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

// Import models
import User from '../models/User.js';
import Component from '../models/Component.js';
import ThemeConfig from '../models/ThemeConfig.js';

const MONGODB_URI = process.env.MONGODB_URI;

const systemComponents = [
  {
    name: 'HeroSection',
    displayName: 'Hero Section',
    type: 'system',
    category: 'layout',
    baseComponent: 'HeroSection',
    propsSchema: [
      { fieldName: 'title', label: 'Title', type: 'text', required: true },
      { fieldName: 'description', label: 'Description', type: 'text' },
      { fieldName: 'backgroundImage', label: 'Background Image', type: 'image' },
      {
        fieldName: 'breadcrumb',
        label: 'Breadcrumb Items',
        type: 'repeater',
        fields: [
          { fieldName: 'title', label: 'Title', type: 'text', required: true },
          { fieldName: 'href', label: 'Link', type: 'text' },
        ],
      },
    ],
    defaultProps: {
      title: 'Page Title',
      description: 'Page description goes here',
    },
  },
  {
    name: 'HeaderSection',
    displayName: 'Header',
    type: 'system',
    category: 'navigation',
    baseComponent: 'HeaderSection',
    propsSchema: [],
    defaultProps: {},
  },
  {
    name: 'FooterSection',
    displayName: 'Footer',
    type: 'system',
    category: 'navigation',
    baseComponent: 'FooterSection',
    propsSchema: [],
    defaultProps: {},
  },
  {
    name: 'ContentBlock',
    displayName: 'Content Block',
    type: 'system',
    category: 'content',
    baseComponent: 'ContentBlock',
    propsSchema: [
      { fieldName: 'title', label: 'Title', type: 'text' },
      { fieldName: 'subtitle', label: 'Subtitle', type: 'text' },
      { fieldName: 'content', label: 'Content', type: 'richtext' },
      { fieldName: 'image', label: 'Image', type: 'image' },
      {
        fieldName: 'imagePosition',
        label: 'Image Position',
        type: 'select',
        options: [
          { label: 'Left', value: 'left' },
          { label: 'Right', value: 'right' },
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
      { fieldName: 'fullWidth', label: 'Full Width', type: 'boolean' },
    ],
    defaultProps: {
      title: 'Content Title',
      content: '<p>Content goes here</p>',
      imagePosition: 'right',
      fullWidth: false,
    },
  },
  {
    name: 'TeamGrid',
    displayName: 'Team Section',
    type: 'system',
    category: 'content',
    baseComponent: 'TeamGrid',
    propsSchema: [
      { fieldName: 'title', label: 'Section Title', type: 'text' },
      { fieldName: 'subtitle', label: 'Section Subtitle', type: 'text' },
      {
        fieldName: 'members',
        label: 'Team Members',
        type: 'repeater',
        fields: [
          { fieldName: 'name', label: 'Name', type: 'text', required: true },
          { fieldName: 'title', label: 'Title/Position', type: 'text' },
          { fieldName: 'qualification', label: 'Qualification', type: 'text' },
          { fieldName: 'image', label: 'Photo', type: 'image' },
          { fieldName: 'bio', label: 'Bio', type: 'richtext' },
        ],
      },
      {
        fieldName: 'columns',
        label: 'Grid Columns',
        type: 'select',
        options: [
          { label: '2 Columns', value: '2' },
          { label: '3 Columns', value: '3' },
          { label: '4 Columns', value: '4' },
        ],
      },
    ],
    defaultProps: {
      title: 'Our Team',
      columns: '4',
      members: [],
    },
  },
  {
    name: 'GallerySection',
    displayName: 'Gallery',
    type: 'system',
    category: 'content',
    baseComponent: 'GallerySection',
    propsSchema: [
      { fieldName: 'title', label: 'Section Title', type: 'text' },
      {
        fieldName: 'images',
        label: 'Gallery Images',
        type: 'repeater',
        fields: [
          { fieldName: 'src', label: 'Image', type: 'image', required: true },
          { fieldName: 'alt', label: 'Alt Text', type: 'text' },
          { fieldName: 'caption', label: 'Caption', type: 'text' },
        ],
      },
      {
        fieldName: 'columns',
        label: 'Grid Columns',
        type: 'select',
        options: [
          { label: '2 Columns', value: '2' },
          { label: '3 Columns', value: '3' },
          { label: '4 Columns', value: '4' },
        ],
      },
    ],
    defaultProps: {
      title: 'Gallery',
      columns: '3',
      images: [],
    },
  },
  {
    name: 'VideoSection',
    displayName: 'Video Section',
    type: 'system',
    category: 'content',
    baseComponent: 'VideoSection',
    propsSchema: [
      { fieldName: 'title', label: 'Section Title', type: 'text' },
      { fieldName: 'description', label: 'Description', type: 'text' },
      { fieldName: 'videoUrl', label: 'Video URL (YouTube/Vimeo)', type: 'text', required: true },
      { fieldName: 'thumbnail', label: 'Thumbnail Image', type: 'image' },
    ],
    defaultProps: {
      title: 'Watch Our Video',
    },
  },
  {
    name: 'FAQSection',
    displayName: 'FAQ Section',
    type: 'system',
    category: 'content',
    baseComponent: 'FAQSection',
    propsSchema: [
      { fieldName: 'title', label: 'Section Title', type: 'text' },
      {
        fieldName: 'items',
        label: 'FAQ Items',
        type: 'repeater',
        fields: [
          { fieldName: 'question', label: 'Question', type: 'text', required: true },
          { fieldName: 'answer', label: 'Answer', type: 'richtext', required: true },
        ],
      },
    ],
    defaultProps: {
      title: 'Frequently Asked Questions',
      items: [],
    },
  },
  {
    name: 'ContactFormSection',
    displayName: 'Contact Form',
    type: 'system',
    category: 'marketing',
    baseComponent: 'ContactFormSection',
    propsSchema: [
      { fieldName: 'title', label: 'Form Title', type: 'text' },
      { fieldName: 'description', label: 'Form Description', type: 'text' },
      {
        fieldName: 'fields',
        label: 'Form Fields',
        type: 'repeater',
        fields: [
          { fieldName: 'name', label: 'Field Name', type: 'text', required: true },
          { fieldName: 'label', label: 'Field Label', type: 'text', required: true },
          {
            fieldName: 'type',
            label: 'Field Type',
            type: 'select',
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'tel' },
              { label: 'Textarea', value: 'textarea' },
              { label: 'Select', value: 'select' },
            ],
          },
          { fieldName: 'required', label: 'Required', type: 'boolean' },
          { fieldName: 'placeholder', label: 'Placeholder', type: 'text' },
        ],
      },
      { fieldName: 'submitText', label: 'Submit Button Text', type: 'text' },
      { fieldName: 'successMessage', label: 'Success Message', type: 'text' },
    ],
    defaultProps: {
      title: 'Contact Us',
      submitText: 'Send Message',
      successMessage: 'Thank you for your message!',
      fields: [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your name' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Your email' },
        { name: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Your message' },
      ],
    },
  },
  {
    name: 'BlogListing',
    displayName: 'Blog Listing',
    type: 'system',
    category: 'content',
    baseComponent: 'BlogListing',
    propsSchema: [
      { fieldName: 'title', label: 'Section Title', type: 'text' },
      { fieldName: 'postsPerPage', label: 'Posts Per Page', type: 'number' },
      { fieldName: 'showCategories', label: 'Show Category Filter', type: 'boolean' },
    ],
    defaultProps: {
      title: 'Latest News',
      postsPerPage: 6,
      showCategories: true,
    },
  },
  {
    name: 'GridLayout',
    displayName: 'Grid Layout',
    type: 'system',
    category: 'layout',
    baseComponent: 'GridLayout',
    propsSchema: [
      { fieldName: 'title', label: 'Section Title', type: 'text' },
      {
        fieldName: 'columns',
        label: 'Columns',
        type: 'select',
        options: [
          { label: '2 Columns', value: '2' },
          { label: '3 Columns', value: '3' },
          { label: '4 Columns', value: '4' },
        ],
      },
      {
        fieldName: 'items',
        label: 'Grid Items',
        type: 'repeater',
        fields: [
          { fieldName: 'title', label: 'Title', type: 'text' },
          { fieldName: 'description', label: 'Description', type: 'richtext' },
          { fieldName: 'image', label: 'Image', type: 'image' },
          { fieldName: 'link', label: 'Link URL', type: 'text' },
        ],
      },
      { fieldName: 'fullWidth', label: 'Full Width Background', type: 'boolean' },
    ],
    defaultProps: {
      columns: '3',
      fullWidth: false,
      items: [],
    },
  },
  {
    name: 'ModalSection',
    displayName: 'Modal Section',
    type: 'system',
    category: 'content',
    baseComponent: 'ModalSection',
    propsSchema: [
      { fieldName: 'triggerText', label: 'Trigger Button Text', type: 'text', required: true },
      { fieldName: 'modalTitle', label: 'Modal Title', type: 'text' },
      { fieldName: 'content', label: 'Modal Content', type: 'richtext' },
      { fieldName: 'image', label: 'Modal Image', type: 'image' },
    ],
    defaultProps: {
      triggerText: 'Learn More',
      modalTitle: 'Details',
    },
  },
];

const defaultThemeConfig = {
  mode: 'light',
  primaryColor: '#CF372F',
  secondaryColor: '#691C18',
  fontFamily: 'Inter',
  fontSize: { base: '16px', heading: '36px' },
  layoutWidth: '1400px',
  headerStyle: {},
  footerStyle: {},
  isActive: true,
};

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed admin user
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL || 'admin@mescotrust.org' });
    if (!existingAdmin) {
      const hashedPassword = await bcryptjs.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
      await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@mescotrust.org',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      });
      console.log('Admin user created');
    } else {
      console.log('Admin user already exists');
    }

    // Seed system components
    for (const comp of systemComponents) {
      const existing = await Component.findOne({ name: comp.name });
      if (!existing) {
        await Component.create(comp);
        console.log(`System component created: ${comp.displayName}`);
      } else {
        // Update existing system component schema
        await Component.updateOne({ name: comp.name }, { $set: comp });
        console.log(`System component updated: ${comp.displayName}`);
      }
    }

    // Seed theme config
    const existingTheme = await ThemeConfig.findOne({ isActive: true });
    if (!existingTheme) {
      await ThemeConfig.create(defaultThemeConfig);
      console.log('Default theme config created');
    } else {
      console.log('Theme config already exists');
    }

    console.log('\nSeed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
