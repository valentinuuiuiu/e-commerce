import { SignUp } from '@clerk/nextjs';
import React from 'react';

import { Gutter } from '../../../_components/Gutter';
import classes from './index.module.scss'; // Can reuse sign-in styles or create new if needed

export default function SignUpPage() {
  return (
    <Gutter className={classes.container}>
      <div className={classes.formContainer}>
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </div>
    </Gutter>
  );
}
