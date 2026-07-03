// מרשם הסוכנים — נקודת ההרחבה המרכזית.
// הוספת סוכן עתידי = קובץ חדש + שורה כאן. שום דבר אחר לא משתנה.

import * as marketing from './marketing';
import * as matching from './matching';
import * as negotiation from './negotiation';
import * as tasks from './tasks';

export interface AgentDef {
  label: string;
  description: string;
  run: (input: any) => Promise<any>;
}

export const AGENTS: Record<string, AgentDef> = {
  marketing: {
    label: 'סוכן שיווק',
    description: 'מייצר תיאורי נכס, פוסטים לרשתות וכותרות מכירתיות בעברית',
    run: marketing.run,
  },
  matching: {
    label: 'סוכן התאמות',
    description: 'מתאים לידים לנכסים במלאי עם ניקוד ונימוקים',
    run: matching.run,
  },
  negotiation: {
    label: 'סוכן מו"מ ומכירות',
    description: 'מכין נקודות מו"מ, מנתח הצעות ומציע אסטרטגיית סגירה',
    run: negotiation.run,
  },
  tasks: {
    label: 'סוכן ניהול משימות',
    description: 'מסכם את היום, מתעדף מעקבים ומזהה לידים מתקררים',
    run: tasks.run,
  },
};

export type AgentKey = keyof typeof AGENTS;
