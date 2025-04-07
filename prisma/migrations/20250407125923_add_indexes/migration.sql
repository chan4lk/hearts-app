-- CreateIndex
CREATE INDEX "Feedback_goalId_idx" ON "Feedback"("goalId");

-- CreateIndex
CREATE INDEX "Feedback_givenById_idx" ON "Feedback"("givenById");

-- CreateIndex
CREATE INDEX "Feedback_receivedById_idx" ON "Feedback"("receivedById");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Goal_managerId_idx" ON "Goal"("managerId");

-- CreateIndex
CREATE INDEX "Rating_goalId_idx" ON "Rating"("goalId");

-- CreateIndex
CREATE INDEX "Rating_selfRatedById_idx" ON "Rating"("selfRatedById");

-- CreateIndex
CREATE INDEX "Rating_managerRatedById_idx" ON "Rating"("managerRatedById");
