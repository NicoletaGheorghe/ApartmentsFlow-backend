import { render, screen, fireEvent } from '@testing-library/react';
import NoteCard from '../NoteCard';

// Mock the note data
const mockNote = {
  _id: '1',
  title: 'Test Note',
  content: 'This is a test note content',
  category: 'general',
  priority: 'medium',
  createdAt: '2024-01-01T00:00:00.000Z'
};

// Mock the handlers
const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('NoteCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders note information correctly', () => {
    render(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    expect(screen.getByText('Test Note')).toBeInTheDocument();
    expect(screen.getByText('This is a test note content')).toBeInTheDocument();
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  test('calls onEdit when edit button is clicked', () => {
    render(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith('1', null, true);
  });

  test('calls onDelete when delete button is clicked', () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);

    render(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  test('does not call onDelete when user cancels confirmation', () => {
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );

    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  test('renders edit form when isEditing is true', () => {
    render(
      <NoteCard 
        note={mockNote} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        isEditing={true}
      />
    );

    expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is a test note content')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
}); 