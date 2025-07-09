import { SignIn } from '@clerk/nextjs';
import React from 'react';

import { Gutter } from '../../../_components/Gutter'; // Assuming Gutter is appropriate for centering
import classes from './index.module.scss'; // For styling the page container

export default function SignInPage() {
  return (
    <Gutter className={classes.container}>
      <div className={classes.formContainer}>
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </div>
    </Gutter>
  );
}
