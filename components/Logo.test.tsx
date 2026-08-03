import { render, screen } from '@testing-library/react';
import Logo from './Logo';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

describe('Logo', () => {
  it('renders correctly', () => {
    render(
      <BrowserRouter>
        <Logo />
      </BrowserRouter>
    );
    expect(screen.getByText('VENDELO')).toBeInTheDocument();
  });
});
