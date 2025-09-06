'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import CourseSelector from './CourseSelector';
import MultiCourseSelector from './MultiCourseSelector';

const CreateSwapModal = ({ courses, onSwapCreated }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [givingSection, setGivingSection] = useState("");
  const [askingSections, setAskingSections] = useState([]);

  const handleSubmit = async () => {
    if (!givingSection || askingSections.length === 0) {
      alert('Please select both giving and asking sections');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/courseswap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          givingSection: parseInt(givingSection),
          askingSection: askingSections.map(id => parseInt(id))
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Swap request created successfully!');
        setModalOpen(false);
        setGivingSection("");
        setAskingSections([]);
        onSwapCreated?.();
      } else {
        throw new Error('Failed to create swap');
      }
    } catch (error) {
      console.error('Error creating swap:', error);
      alert('Failed to create swap request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <div className="px-4 py-2 bg-white hover:bg-gray-300 text-gray-800 rounded-lg cursor-pointer transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Swap
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Course Swap Request</DialogTitle>
          <DialogDescription>
            Select the section you want to give and the sections you're willing to take in exchange.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <CourseSelector
            label="You Give"
            courses={courses}
            value={givingSection}
            onChange={setGivingSection}
            placeholder="Select section to give..."
          />

          <MultiCourseSelector
            label="You Get (Multiple)"
            courses={courses}
            values={askingSections}
            onChange={setAskingSections}
            placeholder="Select sections you want..."
          />
        </div>

        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleSubmit}
            disabled={submitting || !givingSection || askingSections.length === 0}
            className="bg-green-600 hover:bg-green-700 px-8"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Swap'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSwapModal;