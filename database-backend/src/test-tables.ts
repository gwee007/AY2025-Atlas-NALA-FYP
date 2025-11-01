import prisma from './prisma';

async function testTables() {
  try {
    console.log('🧪 Testing NALA database tables...');
    
    // Create a test user
    console.log('1. Creating a test user...');
    const user = await prisma.user.create({
      data: {
        hashed_id: 'test_hash_123',
        username: 'test_user',
        email: 'test@example.com',
        password: 'hashed_password_test',
        avatar: 'https://i.pravatar.cc/150?img=99',
        group: 'students'
      }
    });
    console.log('✅ User created:', user);
    
    // Create a test course
    console.log('\n2. Creating a test course...');
    const course = await prisma.course.create({
      data: {
        course_code: 'TEST101',
        name: 'Test Course'
      }
    });
    console.log('✅ Course created:', course);
    
    // Create a test chatbot
    console.log('\n3. Creating a test chatbot...');
    const chatbot = await prisma.chatbot.create({
      data: {
        created_by_id: user.user_id,
        course_id: course.course_id,
        name: 'Test Chatbot',
        url_path: '/chatbot/test',
        db_endpoint: 'https://db.example.com/test',
        db_name: 'test_chatbot',
        control: 1
      }
    });
    console.log('✅ Chatbot created:', chatbot);
    
    // Create a test topic
    console.log('\n4. Creating a test topic...');
    const topic = await prisma.topic.create({
      data: {
        name: 'Test Topic',
        taxonomy: {
          bloom: ['Remember', 'Understand'],
          solo: ['Unistructural']
        }
      }
    });
    console.log('✅ Topic created:', topic);
    
    // Create a test conversation
    console.log('\n5. Creating a test conversation...');
    const conversation = await prisma.conversation.create({
      data: {
        created_by_id: user.user_id,
        chatbot_id: chatbot.chatbot_id,
        title: 'Test Conversation',
        triggered_by: 'user',
        last_accessed: new Date()
      }
    });
    console.log('✅ Conversation created:', conversation);
    
    // Fetch data with relations
    console.log('\n6. Fetching user with all relations...');
    const userWithData = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      include: {
        conversations: true,
        chatbots: true,
        activity_logs: true
      }
    });
    console.log('✅ User with relations:', JSON.stringify(userWithData, null, 2));
    
    // Clean up test data
    console.log('\n7. Cleaning up test data...');
    await prisma.conversation.deleteMany({ where: { conversation_id: conversation.conversation_id } });
    await prisma.topic.deleteMany({ where: { topic_id: topic.topic_id } });
    await prisma.chatbot.deleteMany({ where: { chatbot_id: chatbot.chatbot_id } });
    await prisma.course.deleteMany({ where: { course_id: course.course_id } });
    await prisma.user.deleteMany({ where: { user_id: user.user_id } });
    console.log('✅ Test data cleaned up');
    
    console.log('\n🎉 All NALA table tests passed!');
    
  } catch (error) {
    console.error('❌ Error testing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTables();