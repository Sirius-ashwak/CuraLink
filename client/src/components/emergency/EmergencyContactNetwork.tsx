
import React, { useState } from 'react';
import { Phone, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface Contact {
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyContactNetwork() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContact, setNewContact] = useState<Contact>({ name: '', phone: '', relation: '' });

  const addContact = () => {
    if (newContact.name && newContact.phone) {
      setContacts(prev => [...prev, newContact]);
      setNewContact({ name: '', phone: '', relation: '' });
    }
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <Input
          placeholder="Contact Name"
          value={newContact.name}
          onChange={e => setNewContact(prev => ({ ...prev, name: e.target.value }))}
        />
        <Input
          placeholder="Phone Number"
          value={newContact.phone}
          onChange={e => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
        />
        <Input
          placeholder="Relationship"
          value={newContact.relation}
          onChange={e => setNewContact(prev => ({ ...prev, relation: e.target.value }))}
        />
        <Button onClick={addContact}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      <div className="grid gap-4">
        {contacts.map((contact, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{contact.name}</h3>
                <div className="flex items-center text-sm text-gray-400">
                  <Phone className="w-4 h-4 mr-1" />
                  {contact.phone} • {contact.relation}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeContact(index)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
