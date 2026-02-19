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
import { toast } from 'sonner';

const CreateSwapModal = ({ courses, onSwapCreated, isMobile = false }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [givingSection, setGivingSection] = useState("");
  const [askingSections, setAskingSections] = useState([]);

  const handleSubmit = async () => {
    if (!givingSection || askingSections.length === 0) {
      toast.error('Please select a section to give and at least one section to get.');
      return;
    }

    // Prevent offering and asking for the same section
    if (askingSections.includes(givingSection)) {
      toast.error('You cannot ask for the same section you are offering.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/swap', {
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
        toast.success('Swap request created successfully!');
        setModalOpen(false);
        setGivingSection("");
        setAskingSections([]);
        onSwapCreated?.();
      } else {
        throw new Error('Failed to create swap');
      }
    } catch (error) {
      console.error('Error creating swap:', error);
      toast.error('Failed to create swap request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogTrigger asChild>
        <div className={`flex items-center justify-center gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium shadow-sm transition-all hover:opacity-90 cursor-pointer ${isMobile ? 'px-3 py-2.5' : 'px-4 py-2'}`} title="Create Swap">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          {!isMobile && <span>Create Swap</span>}
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
            excludeSectionId={givingSection}
          />
        </div>

        <div className="flex justify-center mt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !givingSection || askingSections.length === 0}
            className="bg-green-600 hover:bg-green-700 px-8 transition-all hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
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