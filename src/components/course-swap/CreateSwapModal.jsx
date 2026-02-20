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
import { Plus, Loader2, ArrowRightLeft } from "lucide-react";
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
        <div className={`flex items-center justify-center gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-lg font-medium shadow-sm transition-all hover:opacity-90 cursor-pointer px-3 py-2.5 md:px-4 md:py-2`} title="Create Swap">
          <Plus className="w-4 h-4 md:w-5 md:h-5" />
          <span className="hidden md:inline">Create Swap</span>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] sm:w-full bg-white dark:bg-[#0f172a] border-gray-200 dark:border-blue-800/50 p-0 shadow-xl flex flex-col top-4 translate-y-0 sm:top-[50%] sm:translate-y-[-50%] max-h-[85vh] gap-0">
        <DialogHeader className="p-4 border-b border-gray-200 dark:border-blue-800/50 shrink-0 text-left">
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white pr-6">Create Swap Request</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-blue-300/70 mt-1">
            Select the section to give and sections you'll take.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-visible p-4 gap-6 md:gap-4 md:items-start">
          <div className="flex-1 min-w-0">
            <CourseSelector
              label="You Give"
              courses={courses}
              value={givingSection}
              onChange={setGivingSection}
              placeholder="Select section to give..."
            />
          </div>

          <div className="hidden md:flex flex-col items-center justify-center pt-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 text-gray-500 dark:text-gray-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <MultiCourseSelector
              label="You Get (Multiple)"
              courses={courses}
              values={askingSections}
              onChange={setAskingSections}
              placeholder="Select sections you want..."
              excludeSectionId={givingSection}
            />
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-gray-200 dark:border-blue-800/50 bg-gray-50 dark:bg-[#0c1629] shrink-0 rounded-b-lg">
          <Button
            onClick={() => setModalOpen(false)}
            variant="outline"
            className="flex-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 dark:bg-transparent dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 h-[42px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !givingSection || askingSections.length === 0}
            className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white transition-colors h-[42px]"
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