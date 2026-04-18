'use client';

import React from 'react';

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="krishi-card p-6">
          <h2 className="text-lg font-medium text-krishi-dark">কিছু একটা সমস্যা হয়েছে</h2>
          <p className="mt-2 text-sm text-krishi-muted">পৃষ্ঠা রিফ্রেশ করে আবার চেষ্টা করুন।</p>
        </div>
      );
    }

    return this.props.children;
  }
}
