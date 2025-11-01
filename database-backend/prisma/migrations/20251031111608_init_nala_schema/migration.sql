/*
  Warnings:

  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `posts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."comments" DROP CONSTRAINT "comments_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."posts" DROP CONSTRAINT "posts_authorId_fkey";

-- DropTable
DROP TABLE "public"."comments";

-- DropTable
DROP TABLE "public"."posts";

-- DropTable
DROP TABLE "public"."users";

-- CreateTable
CREATE TABLE "user" (
    "user_id" SERIAL NOT NULL,
    "hashed_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "group" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "log_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "log_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "conversation_id" SERIAL NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "chatbot_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "triggered_by" TEXT NOT NULL,
    "last_accessed" TIMESTAMP NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateTable
CREATE TABLE "message" (
    "message_id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "timestamp" TIMESTAMP NOT NULL,
    "sender" TEXT NOT NULL,
    "text" JSONB NOT NULL,
    "context" JSONB NOT NULL,
    "user_evaluation" BOOLEAN,
    "user_feedback" TEXT,

    CONSTRAINT "message_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "consent" (
    "consent_id" SERIAL NOT NULL,
    "consent_form_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chatbot_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "consent_current_research" BOOLEAN NOT NULL,
    "consent_future_research" INTEGER NOT NULL,
    "consent_contact" BOOLEAN NOT NULL,
    "consent_usage" BOOLEAN NOT NULL,
    "signed_date_current_research" TIMESTAMP NOT NULL,

    CONSTRAINT "consent_pkey" PRIMARY KEY ("consent_id")
);

-- CreateTable
CREATE TABLE "consent_form" (
    "form_id" SERIAL NOT NULL,
    "irb_number" TEXT NOT NULL,
    "content" JSONB NOT NULL,

    CONSTRAINT "consent_form_pkey" PRIMARY KEY ("form_id")
);

-- CreateTable
CREATE TABLE "topic" (
    "topic_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "taxonomy" JSONB NOT NULL,

    CONSTRAINT "topic_pkey" PRIMARY KEY ("topic_id")
);

-- CreateTable
CREATE TABLE "prod_config" (
    "prod_config_id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "prod_config_pkey" PRIMARY KEY ("prod_config_id")
);

-- CreateTable
CREATE TABLE "sandbox_config" (
    "sandbox_config_id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "sandbox_config_pkey" PRIMARY KEY ("sandbox_config_id")
);

-- CreateTable
CREATE TABLE "question" (
    "question_id" SERIAL NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "grade" TEXT,
    "feedback" TEXT,
    "solo_taxonomy_label" TEXT,

    CONSTRAINT "question_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "answer" (
    "answer_id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "message_id" INTEGER NOT NULL,
    "topic_id" INTEGER NOT NULL,
    "accuracy" TEXT,
    "feedback" TEXT,
    "bloom_taxonomy_label" TEXT,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("answer_id")
);

-- CreateTable
CREATE TABLE "chatbot" (
    "chatbot_id" SERIAL NOT NULL,
    "created_by_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "url_path" TEXT NOT NULL,
    "db_endpoint" TEXT NOT NULL,
    "db_name" TEXT NOT NULL,
    "control" INTEGER NOT NULL,

    CONSTRAINT "chatbot_pkey" PRIMARY KEY ("chatbot_id")
);

-- CreateTable
CREATE TABLE "course" (
    "course_id" SERIAL NOT NULL,
    "course_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "course_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "interaction_data" (
    "id" SERIAL NOT NULL,
    "InteractionType" TEXT NOT NULL,
    "StartTime" TIMESTAMP(3) NOT NULL,
    "EndTime" TIMESTAMP(3) NOT NULL,
    "DurationSeconds" INTEGER NOT NULL,
    "InteractionCount" INTEGER NOT NULL,

    CONSTRAINT "interaction_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grading_data" (
    "id" SERIAL NOT NULL,
    "ActivityType" TEXT NOT NULL,
    "TotalPointsPossible" DECIMAL(65,30) NOT NULL,
    "PointsAchieved" DECIMAL(65,30) NOT NULL,
    "IsQuestionCorrect" BOOLEAN NOT NULL,
    "AnswerQualityScore" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "grading_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "chatbot"("chatbot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("conversation_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_consent_form_id_fkey" FOREIGN KEY ("consent_form_id") REFERENCES "consent_form"("form_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent" ADD CONSTRAINT "consent_chatbot_id_fkey" FOREIGN KEY ("chatbot_id") REFERENCES "chatbot"("chatbot_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic"("topic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "question"("question_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("message_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topic"("topic_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot" ADD CONSTRAINT "chatbot_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot" ADD CONSTRAINT "chatbot_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "course"("course_id") ON DELETE RESTRICT ON UPDATE CASCADE;
