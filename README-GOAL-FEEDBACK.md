# 🎯 Goal-Based Feedback System

A focused 360-degree feedback system that integrates directly with employee goals to provide targeted performance assessment and development insights.

## 🚀 Features

### **For Admins & Managers:**
- **Create Goal-Based Feedback Cycles:** Target specific goals or goal categories
- **Employee Selection:** Choose specific employees or target by goal ownership
- **Competency Assessment:** Select relevant competencies for goal evaluation
- **Progress Tracking:** Monitor feedback completion and goal alignment

### **For Employees:**
- **Goal-Focused Feedback:** View feedback specifically related to your goals
- **Competency Analysis:** See how your performance aligns with goal requirements
- **Progress Correlation:** Track how feedback relates to goal achievement
- **Development Insights:** Identify areas for improvement based on goal context

## 🏗️ System Architecture

### **Database Integration**
- **Goal Linking:** Feedback cycles can be linked to specific goals or goal categories
- **User Hierarchy:** Respects existing manager-employee relationships
- **Competency Framework:** Goal-relevant competencies for targeted assessment

### **API Endpoints**
- `POST /api/feedback-cycles/goal-based` - Create goal-based feedback cycles
- `GET /api/feedback-360/goal-feedback` - Retrieve goal-related feedback
- `GET /api/competencies` - Get available competencies

### **Frontend Pages**
- `/dashboard/feedback-360/goal-based` - Create goal-based cycles (Admin/Manager)
- `/dashboard/feedback-360/goal-results` - View goal feedback (Employee)

## 🎯 Usage Examples

### **Leadership Development**
1. Manager creates feedback cycle for "Leadership" goal category
2. System targets employees with leadership goals
3. Feedback focuses on leadership competencies
4. Employees see feedback aligned with their leadership development

### **Project-Based Assessment**
1. Manager creates cycle for specific project goals
2. Team provides feedback on project-related competencies
3. Feedback considers project outcomes and collaboration
4. Performance evaluation tied to project success

### **Quarterly Goal Review**
1. Admin creates cycle for all active goals
2. Comprehensive assessment across goal categories
3. Feedback provides context for goal achievement
4. Development planning based on goal alignment

## 🛠️ Setup Instructions

### **1. Database Setup**
```bash
# Run migrations to add goal integration fields
npm run prisma:migrate

# Seed basic users (admin, manager, employee)
npm run prisma:seed
```

### **2. Start Application**
```bash
npm run dev
```

### **3. Access the System**
- **Admin/Manager:** Navigate to "Goal-Based Feedback" in dashboard
- **Employee:** Navigate to "Goal Feedback" in dashboard

## 👥 User Workflows

### **Creating Goal-Based Feedback (Admin/Manager)**
1. Go to `/dashboard/feedback-360/goal-based`
2. Fill in cycle details (name, dates, type)
3. Select targeting method:
   - **Specific Goal:** Choose individual goal
   - **Goal Category:** Target all goals in category
   - **Employee Selection:** Choose specific employees
4. Select relevant competencies
5. Configure feedback types (self, manager, peer, subordinate)
6. Create cycle and assign participants

### **Viewing Goal Feedback (Employee)**
1. Go to `/dashboard/feedback-360/goal-results`
2. View feedback organized by goals
3. See competency assessments for each goal
4. Track progress across different feedback cycles
5. Analyze performance by goal category

## 🔧 Configuration

### **Competencies**
The system uses a flexible competency framework that can be customized for your organization's needs. Competencies are created through the API and can be tailored to specific goal categories and requirements.

### **Feedback Types**
- **Self Assessment:** Personal reflection on goal-related performance
- **Manager Feedback:** Direct supervisor assessment of goal achievement
- **Peer Feedback:** Colleague feedback on goal-related competencies
- **Subordinate Feedback:** Direct report feedback (for managers)

### **Goal Integration**
- **Direct Goal Link:** Feedback cycle tied to specific goal
- **Category Targeting:** Feedback for all goals in a category
- **Employee Scope:** Limit feedback to specific employees
- **Progress Correlation:** Link feedback to goal progress

## 📊 Benefits

### **For Organizations:**
- **Goal Alignment:** Feedback directly supports goal achievement
- **Targeted Development:** Focus on competencies relevant to goals
- **Performance Correlation:** Link feedback to measurable outcomes
- **Strategic Focus:** Align feedback with organizational objectives

### **For Employees:**
- **Contextual Feedback:** Feedback relevant to their specific goals
- **Clear Development Path:** Understand how feedback relates to goals
- **Progress Tracking:** See feedback in context of goal progress
- **Focused Improvement:** Target development efforts on goal-related areas

### **For Managers:**
- **Goal-Specific Assessment:** Evaluate performance in goal context
- **Team Development:** Provide targeted feedback for goal achievement
- **Progress Monitoring:** Track both goal progress and feedback
- **Strategic Coaching:** Guide development based on goal requirements

## 🔒 Privacy & Security

- **Role-Based Access:** Users only see feedback they're authorized to view
- **Goal Context:** Feedback is tied to specific goals and competencies
- **Anonymous Options:** Peer and subordinate feedback can be anonymous
- **Audit Trail:** Track all feedback submissions and changes

## 🎯 Success Metrics

- **Goal Completion Rate:** Track how feedback correlates with goal achievement
- **Competency Development:** Monitor improvement in goal-related competencies
- **Feedback Quality:** Assess relevance and usefulness of goal-based feedback
- **Employee Engagement:** Measure participation in goal-focused feedback cycles

## 🚨 Troubleshooting

### **Common Issues:**
1. **No Goals Found:** Ensure users have active goals in the system
2. **Missing Competencies:** Create competencies through the API or admin interface
3. **Access Denied:** Verify user roles and permissions
4. **No Feedback:** Check if feedback cycles are active and assigned

### **Getting Help:**
- Check user permissions and goal assignments
- Verify feedback cycle status and dates
- Review competency setup and assignments
- Contact system administrator for technical issues

---

**🎯 Goal-Based Feedback System** - Focused performance assessment that drives goal achievement and development. 