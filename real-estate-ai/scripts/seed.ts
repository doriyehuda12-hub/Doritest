// CLI לזריעת נתוני דמו: npm run seed
import { getDb } from '../lib/db/index';
import { seedIfEmpty } from '../lib/db/seed';

const db = getDb();
const inserted = seedIfEmpty(db);
console.log(inserted ? '✔ נתוני דמו נזרעו בהצלחה' : 'ℹ המסד כבר מכיל נתונים — לא בוצעה זריעה');
