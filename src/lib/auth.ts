/**
 * Simple authentication system for skills wallet
 * In a real app, this would integrate with a proper auth provider
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

// Mock users - in a real app, this would come from a database
const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "Member",
    avatar: "SJ"
  },
  {
    id: "user-2", 
    name: "Mike Chen",
    email: "mike@example.com",
    role: "Member",
    avatar: "MC"
  },
  {
    id: "user-3",
    name: "Emily Rodriguez", 
    email: "emily@example.com",
    role: "Member",
    avatar: "ER"
  },
  {
    id: "admin-1",
    name: "Deborah Goldstein",
    email: "deborah@drivenpros.com",
    role: "Admin",
    avatar: "DG"
  }
];

// Simple session storage for demo purposes
let currentUser: User | null = null;

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('driven-current-user');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return currentUser;
}

export function setCurrentUser(user: User | null): void {
  currentUser = user;
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('driven-current-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('driven-current-user');
    }
  }
}

export function login(email: string, password: string): User | null {
  // Simple mock login - in real app, this would validate against a database
  const user = mockUsers.find(u => u.email === email);
  if (user && password === 'password') { // Mock password
    setCurrentUser(user);
    return user;
  }
  return null;
}

export function logout(): void {
  setCurrentUser(null);
}

export function getAllUsers(): User[] {
  return mockUsers;
}

export function getUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id);
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'Admin';
}

