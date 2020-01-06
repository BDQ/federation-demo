import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/core');
import Ops = require('../lib/ops-stack');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Ops.OpsStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});