import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock login/auth endpoints
  await page.route('**/api/v1/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'mock-jwt-token', user_id: 'user-123' }),
    });
  });

  await page.route('**/api/v1/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'Principal Architect' }),
    });
  });

  // Mock tasks endpoints
  await page.route('**/api/v1/tasks', async route => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 't-1',
            title: 'Learn Playwright E2E',
            description: 'Write end-to-end scenarios',
            status: 'todo',
            priority: 'high',
            estimatedMinutes: 45,
            tags: ['testing', 'e2e'],
            category: 'Work',
            subtasks: [],
          },
        ]),
      });
    } else {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 't-2',
          title: 'Manually Created Task',
          description: 'A manual description',
          status: 'todo',
          priority: 'medium',
          estimatedMinutes: 30,
          tags: ['manual'],
          category: 'Work',
          subtasks: [],
        }),
      });
    }
  });

  await page.route('**/api/v1/tasks/parse-nlp', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reasoning: 'Parsed 1 task from prompt',
        tasks: [
          {
            title: 'Refactor client route guards',
            description: 'Auto-parsed description',
            priority: 'high',
            estimatedMinutes: 60,
            category: 'Engineering',
            tags: ['security'],
          },
        ],
      }),
    });
  });

  // Mock calendar scheduling endpoints
  await page.route('**/api/v1/calendar/events', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'c-1',
          title: 'Deep Focus Block',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 3600000).toISOString(),
          category: 'focus',
        },
      ]),
    });
  });

  await page.route('**/api/v1/calendar/auto-schedule', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        report: 'Auto-scheduled 1 task into available blocks.',
      }),
    });
  });

  // Mock meeting scribe endpoints
  await page.route('**/api/v1/meetings/analyze', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: 'Finalized architectural requirements for deployment.',
        decisions: ['Use Cloud Run for API hosting'],
        actionItems: [
          { id: 'a-1', title: 'Configure Cloud SQL', assignee: 'Alex', estimatedMinutes: 60 },
        ],
      }),
    });
  });

  // Mock document study desk endpoints
  await page.route('**/api/v1/documents', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'doc-1', filename: 'architecture.pdf' }
      ]),
    });
  });

  await page.route('**/api/v1/documents/upload', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'doc-1',
        filename: 'architecture.pdf',
        summary: 'Cloud architecture plan description.',
        flashcards: [{ front: 'What is Vercel?', back: 'A deployment platform for frontend.' }],
        quiz: [{ question: 'What database is used?', choices: ['Firestore', 'PostgreSQL'], answer: 'Firestore' }],
      }),
    });
  });

  await page.route('**/api/v1/documents/doc-1/analyze', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: 'Summarized text content.',
        flashcards: [{ front: 'F1', back: 'B1' }],
        quiz: [{ question: 'Q1', choices: ['C1'], answer: 'C1' }],
      }),
    });
  });

  // Mock workflows endpoints
  await page.route('**/api/v1/workflows', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'wf-1',
          title: 'Weekly Task Sync',
          isActive: true,
          nodes: [{ id: 'n1', type: 'trigger', config: { event: 'on_new_task' } }],
        },
      ]),
    });
  });

  await page.route('**/api/v1/workflows/*/run', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        executedNodesCount: 2
      }),
    });
  });

  // Mock settings endpoints
  await page.route('**/api/v1/auth/settings', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        weeklyHoursLimit: 40,
        dailyThresholdHours: 8,
        focusBlockMinutes: 45,
      }),
    });
  });

  // Mock analytics insights endpoint
  await page.route('**/api/v1/analytics/insights', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        dailyMinutes: [300, 240, 360, 420, 180, 0, 0],
        weeklyFocusHours: 25.5,
        burnoutRiskPercent: 12,
        activeNotifications: [],
      }),
    });
  });

  // Mock analytics briefing endpoint
  await page.route('**/api/v1/analytics/briefing', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        greeting: 'Good morning',
        recommendations: ['Check pending tasks'],
        priorities: [],
        events: []
      }),
    });
  });
});

test('Complete AI Productivity OS User Journey', async ({ page }) => {
  // 1. Visit application, perform login
  await page.goto('/');
  await page.fill('input[placeholder="Email address"]', 'principal@example.com');
  await page.fill('input[type="password"]', 'secretpassword');
  await page.click('button:has-text("Sign In")');

  // Verify dashboard page loading
  await expect(page.locator('.logo-text')).toContainText('Antigravity OS');
  await expect(page.locator('.metric-card >> text=Focus Score')).toBeVisible();

  // 2. Navigation & Task Creation
  await page.click('nav >> text=Task Manager');
  await expect(page.locator('h3:has-text("Task Backlog")')).toBeVisible();
  
  // Fill manual task creator
  await page.fill('input[placeholder="Database assignment..."]', 'Manually Created Task');
  await page.fill('textarea[placeholder="Practice normalization and SQL indexing..."]', 'A manual description');
  await page.click('button:has-text("Create Task")');

  // Perform NLP parsing
  await page.fill('input[placeholder*="Schedule database mid-term prep"]', 'Need to refactor route guards for 60 mins');
  await page.click('button:has-text("Analyze")');
  await expect(page.locator('.ai-verification-area')).toBeVisible();
  await page.click('button:has-text("Create All Tasks")');

  // 3. Navigation & Calendar Scheduler
  await page.click('nav >> text=AI Scheduler');
  await expect(page.locator('h3:has-text("Schedule Agenda")')).toBeVisible();
  await page.click('button:has-text("Auto-Schedule Calendar")');
  await expect(page.locator('.scheduler-report-card')).toBeVisible();

  // 4. Navigation & Meeting Scribe
  await page.click('nav >> text=Meeting Scribe');
  await expect(page.locator('h3:has-text("Meeting Scribe")')).toBeVisible();
  await page.fill('textarea[placeholder*="Paste meeting transcript"]', 'Alex: Configure Cloud SQL for 60m');
  await page.click('button:has-text("Extract Decisions & Action Items")');
  await expect(page.locator('.scribe-results-content')).toBeVisible();
  await page.click('button:has-text("Sync Tasks")');
  await expect(page.locator('.success-banner')).toBeVisible();

  // 5. Navigation & Study Desk (Documents)
  await page.click('nav >> text=Study Desk');
  await expect(page.locator('h3:has-text("Study Library")')).toBeVisible();
  // We can trigger an analysis of the pre-loaded document
  await page.selectOption('.doc-select', 'doc-1');
  await page.click('button:has-text("Summarize")');
  await expect(page.locator('.doc-summary-output')).toBeVisible();

  // 6. Navigation & Node Canvas (Workflows)
  await page.click('nav >> text=Node Canvas');
  await expect(page.locator('h3:has-text("Automation Canvas")')).toBeVisible();
  await page.click('button:has-text("Run Automation")');
  await expect(page.locator('.console-wrapper')).toBeVisible();

  // 7. Settings
  await page.click('.sidebar-footer >> text=Settings');
  await expect(page.locator('h3:has-text("Identity & Profile")')).toBeVisible();

  // 8. Copilot Chat
  await expect(page.locator('.copilot-header-title')).toContainText('Productivity Copilot');
  await page.fill('input[placeholder="Ask Copilot something..."]', 'Optimize my schedule');
  await page.press('input[placeholder="Ask Copilot something..."]', 'Enter');
  await expect(page.locator('.message-bubble.assistant').nth(1)).toBeVisible();
});
