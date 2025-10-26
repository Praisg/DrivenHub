import { EmailMessage } from '@/types';
import Card from '../Card';

interface MessagesListProps {
  emails: EmailMessage[];
}

export default function MessagesList({ emails }: MessagesListProps) {
  const items = emails.slice(0, 5);

  if (items.length === 0) {
    return (
      <Card>
        <p className="text-gray-600">No messages yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((email) => (
        <Card key={email.id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">From: {email.from}</p>
              <h4 className="text-gray-900 font-semibold">{email.subject}</h4>
              <p className="text-gray-700 line-clamp-2">{email.preview}</p>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(email.dateISO).toLocaleDateString()}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}


