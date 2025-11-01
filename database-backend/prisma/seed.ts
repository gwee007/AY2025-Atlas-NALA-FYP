import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  console.log('Starting seed...');

  // Clear existing data (in reverse order of dependencies)
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.activity_log.deleteMany();
  await prisma.chatbot.deleteMany();
  await prisma.course.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.consent_form.deleteMany();
  await prisma.user.deleteMany();
  await prisma.prod_config.deleteMany();
  await prisma.sandbox_config.deleteMany();
  await prisma.InteractionData.deleteMany();
  await prisma.GradingData.deleteMany();

  console.log('Cleared existing data');

  // Seed Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        hashed_id: 'hash_001',
        username: 'john_doe',
        email: 'john.doe@university.edu',
        password: 'hashed_password_1',
        avatar: 'https://i.pravatar.cc/150?img=1',
        group: 'students',
      },
    }),
    prisma.user.create({
      data: {
        hashed_id: 'hash_002',
        username: 'jane_smith',
        email: 'jane.smith@university.edu',
        password: 'hashed_password_2',
        avatar: 'https://i.pravatar.cc/150?img=2',
        group: 'students',
      },
    }),
    prisma.user.create({
      data: {
        hashed_id: 'hash_003',
        username: 'prof_anderson',
        email: 'anderson@university.edu',
        password: 'hashed_password_3',
        avatar: 'https://i.pravatar.cc/150?img=3',
        group: 'instructors',
      },
    }),
    prisma.user.create({
      data: {
        hashed_id: 'hash_004',
        username: 'alice_wong',
        email: 'alice.wong@university.edu',
        password: 'hashed_password_4',
        avatar: 'https://i.pravatar.cc/150?img=4',
        group: 'students',
      },
    }),
    prisma.user.create({
      data: {
        hashed_id: 'hash_005',
        username: 'bob_chen',
        email: 'bob.chen@university.edu',
        password: 'hashed_password_5',
        avatar: 'https://i.pravatar.cc/150?img=5',
        group: 'students',
      },
    }),
  ]);
  console.log('Created 5 users');

  // Seed Courses
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        course_code: 'CS101',
        name: 'Introduction to Computer Science',
      },
    }),
    prisma.course.create({
      data: {
        course_code: 'CS201',
        name: 'Data Structures and Algorithms',
      },
    }),
    prisma.course.create({
      data: {
        course_code: 'CS301',
        name: 'Database Systems',
      },
    }),
    prisma.course.create({
      data: {
        course_code: 'CS401',
        name: 'Machine Learning',
      },
    }),
    prisma.course.create({
      data: {
        course_code: 'MATH202',
        name: 'Discrete Mathematics',
      },
    }),
  ]);
  console.log('Created 5 courses');

  // Seed Chatbots
  const chatbots = await Promise.all([
    prisma.chatbot.create({
      data: {
        created_by_id: users[2].user_id, // Prof Anderson
        course_id: courses[0].course_id,
        name: 'CS101 Study Assistant',
        url_path: '/chatbot/cs101',
        db_endpoint: 'https://db.example.com/cs101',
        db_name: 'cs101_chatbot',
        control: 1,
      },
    }),
    prisma.chatbot.create({
      data: {
        created_by_id: users[2].user_id,
        course_id: courses[1].course_id,
        name: 'Data Structures Helper',
        url_path: '/chatbot/cs201',
        db_endpoint: 'https://db.example.com/cs201',
        db_name: 'cs201_chatbot',
        control: 1,
      },
    }),
    prisma.chatbot.create({
      data: {
        created_by_id: users[2].user_id,
        course_id: courses[2].course_id,
        name: 'Database Tutor',
        url_path: '/chatbot/cs301',
        db_endpoint: 'https://db.example.com/cs301',
        db_name: 'cs301_chatbot',
        control: 1,
      },
    }),
    prisma.chatbot.create({
      data: {
        created_by_id: users[2].user_id,
        course_id: courses[3].course_id,
        name: 'ML Learning Assistant',
        url_path: '/chatbot/cs401',
        db_endpoint: 'https://db.example.com/cs401',
        db_name: 'cs401_chatbot',
        control: 1,
      },
    }),
    prisma.chatbot.create({
      data: {
        created_by_id: users[2].user_id,
        course_id: courses[4].course_id,
        name: 'Math Study Bot',
        url_path: '/chatbot/math202',
        db_endpoint: 'https://db.example.com/math202',
        db_name: 'math202_chatbot',
        control: 0,
      },
    }),
  ]);
  console.log('Created 5 chatbots');

  // Seed Topics
  const topics = await Promise.all([
    prisma.topic.create({
      data: {
        name: 'Variables and Data Types',
        taxonomy: {
          bloom: ['Remember', 'Understand', 'Apply'],
          solo: ['Unistructural', 'Multistructural'],
        },
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Loops and Conditionals',
        taxonomy: {
          bloom: ['Understand', 'Apply', 'Analyze'],
          solo: ['Multistructural', 'Relational'],
        },
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Functions and Methods',
        taxonomy: {
          bloom: ['Apply', 'Analyze', 'Evaluate'],
          solo: ['Relational', 'Extended Abstract'],
        },
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Object-Oriented Programming',
        taxonomy: {
          bloom: ['Analyze', 'Evaluate', 'Create'],
          solo: ['Relational', 'Extended Abstract'],
        },
      },
    }),
    prisma.topic.create({
      data: {
        name: 'Recursion',
        taxonomy: {
          bloom: ['Apply', 'Analyze', 'Create'],
          solo: ['Multistructural', 'Relational', 'Extended Abstract'],
        },
      },
    }),
  ]);
  console.log('Created 5 topics');

  // Seed Conversations
  const conversations = await Promise.all([
    prisma.conversation.create({
      data: {
        created_by_id: users[0].user_id, // John Doe
        chatbot_id: chatbots[0].chatbot_id,
        title: 'Understanding Variables',
        triggered_by: 'user',
        last_accessed: new Date('2024-10-28T14:30:00Z'),
      },
    }),
    prisma.conversation.create({
      data: {
        created_by_id: users[1].user_id, // Jane Smith
        chatbot_id: chatbots[1].chatbot_id,
        title: 'Binary Search Trees',
        triggered_by: 'user',
        last_accessed: new Date('2024-10-29T09:15:00Z'),
      },
    }),
    prisma.conversation.create({
      data: {
        created_by_id: users[3].user_id, // Alice Wong
        chatbot_id: chatbots[0].chatbot_id,
        title: 'Loop Structures Help',
        triggered_by: 'system',
        last_accessed: new Date('2024-10-30T16:45:00Z'),
      },
    }),
    prisma.conversation.create({
      data: {
        created_by_id: users[4].user_id, // Bob Chen
        chatbot_id: chatbots[2].chatbot_id,
        title: 'SQL Queries Tutorial',
        triggered_by: 'user',
        last_accessed: new Date('2024-10-31T10:20:00Z'),
      },
    }),
    prisma.conversation.create({
      data: {
        created_by_id: users[0].user_id,
        chatbot_id: chatbots[1].chatbot_id,
        title: 'Recursion Explained',
        triggered_by: 'user',
        last_accessed: new Date('2024-10-31T11:00:00Z'),
      },
    }),
  ]);
  console.log('Created 5 conversations');

  // Seed Messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        conversation_id: conversations[0].conversation_id,
        timestamp: new Date('2024-10-28T14:30:00Z'),
        sender: 'user',
        text: { content: 'What is a variable in programming?' },
        context: { previous_messages: 0 },
        user_evaluation: true,
        user_feedback: 'Very helpful explanation',
      },
    }),
    prisma.message.create({
      data: {
        conversation_id: conversations[0].conversation_id,
        timestamp: new Date('2024-10-28T14:30:30Z'),
        sender: 'bot',
        text: {
          content:
            'A variable is a named storage location in memory that holds a value which can change during program execution.',
        },
        context: { topic_id: topics[0].topic_id },
        user_evaluation: null,
        user_feedback: null,
      },
    }),
    prisma.message.create({
      data: {
        conversation_id: conversations[1].conversation_id,
        timestamp: new Date('2024-10-29T09:15:00Z'),
        sender: 'user',
        text: { content: 'How do I implement a binary search tree?' },
        context: { previous_messages: 0 },
        user_evaluation: true,
        user_feedback: 'Good starting point',
      },
    }),
    prisma.message.create({
      data: {
        conversation_id: conversations[2].conversation_id,
        timestamp: new Date('2024-10-30T16:45:00Z'),
        sender: 'user',
        text: { content: 'Explain the difference between for and while loops' },
        context: { previous_messages: 2 },
        user_evaluation: false,
        user_feedback: 'Could be more detailed',
      },
    }),
    prisma.message.create({
      data: {
        conversation_id: conversations[3].conversation_id,
        timestamp: new Date('2024-10-31T10:20:00Z'),
        sender: 'user',
        text: { content: 'What is a JOIN in SQL?' },
        context: { previous_messages: 1 },
        user_evaluation: true,
        user_feedback: 'Clear explanation with examples',
      },
    }),
  ]);
  console.log('Created 5 messages');

  // Seed Questions
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        topic_id: topics[0].topic_id,
        message_id: messages[0].message_id,
        grade: 'B+',
        feedback: 'Good question showing understanding of basic concepts',
        solo_taxonomy_label: 'Unistructural',
      },
    }),
    prisma.question.create({
      data: {
        topic_id: topics[2].topic_id,
        message_id: messages[2].message_id,
        grade: 'A-',
        feedback: 'Well-formed question demonstrating higher-order thinking',
        solo_taxonomy_label: 'Relational',
      },
    }),
    prisma.question.create({
      data: {
        topic_id: topics[1].topic_id,
        message_id: messages[3].message_id,
        grade: 'A',
        feedback: 'Excellent comparative question',
        solo_taxonomy_label: 'Multistructural',
      },
    }),
    prisma.question.create({
      data: {
        topic_id: topics[0].topic_id,
        message_id: messages[4].message_id,
        grade: 'B',
        feedback: 'Shows basic understanding, could explore deeper',
        solo_taxonomy_label: 'Unistructural',
      },
    }),
    prisma.question.create({
      data: {
        topic_id: topics[4].topic_id,
        message_id: messages[0].message_id,
        grade: 'A+',
        feedback: 'Outstanding question showing deep conceptual understanding',
        solo_taxonomy_label: 'Extended Abstract',
      },
    }),
  ]);
  console.log('Created 5 questions');

  // Seed Answers
  const answers = await Promise.all([
    prisma.answer.create({
      data: {
        question_id: questions[0].question_id,
        message_id: messages[1].message_id,
        topic_id: topics[0].topic_id,
        accuracy: 'High',
        feedback: 'Accurate and comprehensive response',
        bloom_taxonomy_label: 'Understand',
      },
    }),
    prisma.answer.create({
      data: {
        question_id: questions[1].question_id,
        message_id: messages[2].message_id,
        topic_id: topics[2].topic_id,
        accuracy: 'Medium',
        feedback: 'Correct but could include more detail',
        bloom_taxonomy_label: 'Apply',
      },
    }),
    prisma.answer.create({
      data: {
        question_id: questions[2].question_id,
        message_id: messages[3].message_id,
        topic_id: topics[1].topic_id,
        accuracy: 'High',
        feedback: 'Excellent comparison with examples',
        bloom_taxonomy_label: 'Analyze',
      },
    }),
    prisma.answer.create({
      data: {
        question_id: questions[3].question_id,
        message_id: messages[4].message_id,
        topic_id: topics[0].topic_id,
        accuracy: 'High',
        feedback: 'Clear explanation with practical examples',
        bloom_taxonomy_label: 'Understand',
      },
    }),
    prisma.answer.create({
      data: {
        question_id: questions[4].question_id,
        message_id: messages[1].message_id,
        topic_id: topics[4].topic_id,
        accuracy: 'Very High',
        feedback: 'Exceptional depth and clarity',
        bloom_taxonomy_label: 'Create',
      },
    }),
  ]);
  console.log('Created 5 answers');

  // Seed Activity Logs
  const activityLogs = await Promise.all([
    prisma.activity_log.create({
      data: {
        user_id: users[0].user_id,
        log_type: 'login',
        status: 'success',
      },
    }),
    prisma.activity_log.create({
      data: {
        user_id: users[1].user_id,
        log_type: 'conversation_created',
        status: 'success',
      },
    }),
    prisma.activity_log.create({
      data: {
        user_id: users[2].user_id,
        log_type: 'chatbot_created',
        status: 'success',
      },
    }),
    prisma.activity_log.create({
      data: {
        user_id: users[3].user_id,
        log_type: 'message_sent',
        status: 'success',
      },
    }),
    prisma.activity_log.create({
      data: {
        user_id: users[4].user_id,
        log_type: 'logout',
        status: 'success',
      },
    }),
  ]);
  console.log('Created 5 activity logs');

  // Seed Consent Forms
  const consentForms = await Promise.all([
    prisma.consent_form.create({
      data: {
        irb_number: 'IRB-2024-001',
        content: {
          title: 'Research Participation Consent',
          sections: [
            'Purpose of Study',
            'Procedures',
            'Risks and Benefits',
            'Confidentiality',
          ],
        },
      },
    }),
    prisma.consent_form.create({
      data: {
        irb_number: 'IRB-2024-002',
        content: {
          title: 'Data Collection Consent',
          sections: ['Data Usage', 'Privacy Policy', 'Withdrawal Rights'],
        },
      },
    }),
    prisma.consent_form.create({
      data: {
        irb_number: 'IRB-2024-003',
        content: {
          title: 'Educational Research Consent',
          sections: ['Study Overview', 'Participant Rights', 'Contact Information'],
        },
      },
    }),
    prisma.consent_form.create({
      data: {
        irb_number: 'IRB-2024-004',
        content: {
          title: 'Chatbot Interaction Study',
          sections: ['AI Interaction', 'Data Analysis', 'Results Publication'],
        },
      },
    }),
    prisma.consent_form.create({
      data: {
        irb_number: 'IRB-2024-005',
        content: {
          title: 'Learning Analytics Consent',
          sections: ['Analytics Purpose', 'Data Security', 'Future Research'],
        },
      },
    }),
  ]);
  console.log('Created 5 consent forms');

  // Seed Consents
  const consents = await Promise.all([
    prisma.consent.create({
      data: {
        consent_form_id: consentForms[0].form_id,
        user_id: users[0].user_id,
        chatbot_id: chatbots[0].chatbot_id,
        email: users[0].email,
        consent_current_research: true,
        consent_future_research: 1,
        consent_contact: true,
        consent_usage: true,
        signed_date_current_research: new Date('2024-10-01T10:00:00Z'),
      },
    }),
    prisma.consent.create({
      data: {
        consent_form_id: consentForms[1].form_id,
        user_id: users[1].user_id,
        chatbot_id: chatbots[1].chatbot_id,
        email: users[1].email,
        consent_current_research: true,
        consent_future_research: 1,
        consent_contact: false,
        consent_usage: true,
        signed_date_current_research: new Date('2024-10-02T11:30:00Z'),
      },
    }),
    prisma.consent.create({
      data: {
        consent_form_id: consentForms[2].form_id,
        user_id: users[3].user_id,
        chatbot_id: chatbots[0].chatbot_id,
        email: users[3].email,
        consent_current_research: true,
        consent_future_research: 0,
        consent_contact: true,
        consent_usage: true,
        signed_date_current_research: new Date('2024-10-03T14:20:00Z'),
      },
    }),
    prisma.consent.create({
      data: {
        consent_form_id: consentForms[3].form_id,
        user_id: users[4].user_id,
        chatbot_id: chatbots[2].chatbot_id,
        email: users[4].email,
        consent_current_research: true,
        consent_future_research: 1,
        consent_contact: true,
        consent_usage: false,
        signed_date_current_research: new Date('2024-10-04T09:45:00Z'),
      },
    }),
    prisma.consent.create({
      data: {
        consent_form_id: consentForms[4].form_id,
        user_id: users[0].user_id,
        chatbot_id: chatbots[3].chatbot_id,
        email: users[0].email,
        consent_current_research: false,
        consent_future_research: 0,
        consent_contact: false,
        consent_usage: true,
        signed_date_current_research: new Date('2024-10-05T15:10:00Z'),
      },
    }),
  ]);
  console.log('Created 5 consents');

  // Seed Production Config
  const prodConfigs = await Promise.all([
    prisma.prod_config.create({
      data: {
        key: 'max_message_length',
        value: '2000',
        category: 'messaging',
      },
    }),
    prisma.prod_config.create({
      data: {
        key: 'session_timeout',
        value: '3600',
        category: 'security',
      },
    }),
    prisma.prod_config.create({
      data: {
        key: 'api_rate_limit',
        value: '100',
        category: 'api',
      },
    }),
    prisma.prod_config.create({
      data: {
        key: 'enable_analytics',
        value: 'true',
        category: 'features',
      },
    }),
    prisma.prod_config.create({
      data: {
        key: 'chatbot_response_delay',
        value: '500',
        category: 'performance',
      },
    }),
  ]);
  console.log('Created 5 production configs');

  // Seed Sandbox Config
  const sandboxConfigs = await Promise.all([
    prisma.sandbox_config.create({
      data: {
        key: 'max_message_length',
        value: '5000',
        category: 'messaging',
      },
    }),
    prisma.sandbox_config.create({
      data: {
        key: 'session_timeout',
        value: '7200',
        category: 'security',
      },
    }),
    prisma.sandbox_config.create({
      data: {
        key: 'api_rate_limit',
        value: '1000',
        category: 'api',
      },
    }),
    prisma.sandbox_config.create({
      data: {
        key: 'enable_debug_mode',
        value: 'true',
        category: 'development',
      },
    }),
    prisma.sandbox_config.create({
      data: {
        key: 'mock_ai_responses',
        value: 'true',
        category: 'testing',
      },
    }),
  ]);
  console.log('Created 5 sandbox configs');

  // Seed Interaction Data
  const interactionData = await Promise.all([
    prisma.InteractionData.create({
      data: {
        InteractionType: 'chat_session',
        StartTime: new Date('2024-10-28T14:00:00Z'),
        EndTime: new Date('2024-10-28T14:45:00Z'),
        DurationSeconds: 2700,
        InteractionCount: 15,
      },
    }),
    prisma.InteractionData.create({
      data: {
        InteractionType: 'question_asked',
        StartTime: new Date('2024-10-29T09:00:00Z'),
        EndTime: new Date('2024-10-29T09:30:00Z'),
        DurationSeconds: 1800,
        InteractionCount: 8,
      },
    }),
    prisma.InteractionData.create({
      data: {
        InteractionType: 'document_read',
        StartTime: new Date('2024-10-30T10:00:00Z'),
        EndTime: new Date('2024-10-30T10:20:00Z'),
        DurationSeconds: 1200,
        InteractionCount: 5,
      },
    }),
    prisma.InteractionData.create({
      data: {
        InteractionType: 'practice_problem',
        StartTime: new Date('2024-10-31T11:00:00Z'),
        EndTime: new Date('2024-10-31T12:00:00Z'),
        DurationSeconds: 3600,
        InteractionCount: 12,
      },
    }),
    prisma.InteractionData.create({
      data: {
        InteractionType: 'feedback_provided',
        StartTime: new Date('2024-10-31T15:00:00Z'),
        EndTime: new Date('2024-10-31T15:10:00Z'),
        DurationSeconds: 600,
        InteractionCount: 3,
      },
    }),
  ]);
  console.log('Created 5 interaction data records');

  // Seed Grading Data
  const gradingData = await Promise.all([
    prisma.GradingData.create({
      data: {
        ActivityType: 'quiz',
        TotalPointsPossible: 100,
        PointsAchieved: 85,
        IsQuestionCorrect: true,
        AnswerQualityScore: 4.2,
      },
    }),
    prisma.GradingData.create({
      data: {
        ActivityType: 'assignment',
        TotalPointsPossible: 50,
        PointsAchieved: 42,
        IsQuestionCorrect: true,
        AnswerQualityScore: 3.8,
      },
    }),
    prisma.GradingData.create({
      data: {
        ActivityType: 'discussion',
        TotalPointsPossible: 20,
        PointsAchieved: 18,
        IsQuestionCorrect: true,
        AnswerQualityScore: 4.5,
      },
    }),
    prisma.GradingData.create({
      data: {
        ActivityType: 'practice',
        TotalPointsPossible: 30,
        PointsAchieved: 22,
        IsQuestionCorrect: false,
        AnswerQualityScore: 3.2,
      },
    }),
    prisma.GradingData.create({
      data: {
        ActivityType: 'exam',
        TotalPointsPossible: 200,
        PointsAchieved: 175,
        IsQuestionCorrect: true,
        AnswerQualityScore: 4.7,
      },
    }),
  ]);
  console.log('Created 5 grading data records');

  console.log('✅ Seed completed successfully!');
  console.log('\nSummary:');
  console.log('- 5 users');
  console.log('- 5 courses');
  console.log('- 5 chatbots');
  console.log('- 5 topics');
  console.log('- 5 conversations');
  console.log('- 5 messages');
  console.log('- 5 questions');
  console.log('- 5 answers');
  console.log('- 5 activity logs');
  console.log('- 5 consent forms');
  console.log('- 5 consents');
  console.log('- 5 production configs');
  console.log('- 5 sandbox configs');
  console.log('- 5 interaction data records');
  console.log('- 5 grading data records');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
