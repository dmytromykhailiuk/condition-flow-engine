# Flexible flow management solution

**Solution for big projects with dynamic application behaviour based on configurations**

## Installation

```sh
npm i @dmytromykhailiuk/condition-flow-engine
```

## Purpose

**Why you should use this library?**
- You need flow runner solution
- You need condition validation solution based on JSON config
- You want to have dynamic application behaviour based on JSON config

**Interesting packages**

- [Dependency Injection Container](https://www.npmjs.com/package/@dmytromykhailiuk/dependency-injection-container)
- [React Dependency Injection Module](https://www.npmjs.com/package/@dmytromykhailiuk/react-di-module)
- [RxJS React Redux Effects](https://www.npmjs.com/package/@dmytromykhailiuk/rx-react-redux-effect)
- [Condition Flow Engine](https://www.npmjs.com/package/@dmytromykhailiuk/condition-flow-engine)

**If you answered yes to one of the options, then this library is right choice.**

## Flow Runner

```typescript

import { ofType, Action, createFlowRunner } from "condition-flow-engine-with-di";

const actions$ = new Subject<Action>();

actions$.pipe(
  ofType('ADD'),
  // we can do any synchronous or asynchronous stuff
  map(({ context, value, id }) => ({ type: 'ADD End', id, context: context + value })), // We should dispatch same action type but with " End" sufix
).subscribe(actions$.next),

actions$.pipe(
  ofType('MULTIPLY'),
  // we can do any synchronous or asynchronous stuff
  map(({ context, value, id }) => ({ type: 'MULTIPLY End', id, context: context * value })), // We should dispatch same action type but with " End" sufix
).subscribe(actions$.next),


const runFlow = createFlowRunner({
  actions$,
  dispatch: actions$.next,
});

runFlow<number>(
  [
    {
      type: 'ADD',
      value: 5
    },
    {
      type: 'MULTIPLY',
      value: 1.5
    },
    {
      type: 'ADD',
      value: -8
    },
  ],
  3
).subscribe((result) => {
  console.log(result); // 4
})

```

## Validate condition

```typescript

import { validateCondition, ConditionObject, Operation } from './condition-functions';

const condition: ConditionObject = {
  operation: Operation.AND,
  value: [
    {
      operation: Operation.GE,
      mapFromGlobalContext: ['damage', 'severity'],
      value: 3,
    },
    {
      operation: Operation.EQ,
      mapFromGlobalContext: ['damage', 'type'],
      value: 'Scratch',
    },
    {
      operation: Operation.TO_BOOLEAN_EQ,
      mapFromGlobalContext: ['damage', 'images'],
      value: true,
    },
    {
      operation: Operation.NE,
      mapFromGlobalContext: ['user', 'role'],
      value: 'admin',
    },
    {
      operation: Operation.INCLUDES,
      mapFromGlobalContext: ['user', 'site'],
      value: [1, 2, 3, 4],
    },
  ],
};

const context1 = {
  damage: {
    severity: 4,
    type: 'Scratch',
    images: ['/images/image1', '/images/image2'],
  },
  user: {
    role: 'client',
    site: 3
  },
};

const context2 = {};

const isContext1Valid = validateCondition({ condition, context: context1 }); // true
const isContext2Valid = validateCondition({ condition, context: context2 }); // false

```

# Condition Flow Engine

## Flow Map

```typescript

const actions$ = new Subject<Action>();

const conditionFlowEngine = createConditionFlowEngine({
  flowRunner: createFlowRunner({
    actions$: actions$.asObservable(),
    dispatch: actions$.next,
  }),
  config: {
    flowsMap: {
      doSomething: [{ type: 'action1' }, { type: 'action2' }],
      doOtherStuff: [{ type: 'action2' }, { type: 'action3' }, { type: 'action3' }],
    },
  }
});

conditionFlowEngine.runFlow('doSomething', null); // run Flow by Flow Name in flowsMap

```

## Condition Map

```typescript

const actions$ = new Subject<Action>();

const conditionFlowEngine = createConditionFlowEngine({
  flowRunner: createFlowRunner({
    actions$: actions$.asObservable(),
    dispatch: actions$.next,
  }),
  config: {
    conditionsMap: {
      isAdmin: {
        operation: Operation.EQ,
        mapFromLocalContext: ['user', 'role'],
        value: 'admin'
      }
    },
  }
});

conditionFlowEngine.validateCondition({ condition: 'isAdmin', context: { user: { role: 'admin' } } }); // validate condition by Condition Name in conditionsMap

```

## Validate Conditions And Run Flow

```typescript

const actions$ = new Subject<Action>();

const conditionFlowEngine = createConditionFlowEngine({
  flowRunner: createFlowRunner({
    actions$: actions$.asObservable(),
    dispatch: actions$.next,
  }),
  config: {
    flowsMap: {
      doSomething: [{ type: 'action1' }, { type: 'action2' }],
      doOtherStuff: [{ type: 'action2' }, { type: 'action3' }, { type: 'action3' }],
    },
    conditionsMap: {
      isAdmin: {
        operation: Operation.EQ,
        mapFromLocalContext: ['user', 'role'],
        value: 'admin',
      },
      isFirstLesson: {
        operation: Operation.EQ,
        mapFromLocalContext: ['lessons', 'length'],
        value: '1',
      },
    },
    flowValidatorMap: {
      canOpenScores: {
        conditionToValidate: 'isAdmin',
        conditionToIgnore: 'isFirstLesson',
        onSuccess: 'doSomething',
      },
    },
  }
});

conditionFlowEngine.validateConditionsAndRunFlow({
  validator: 'canOpenScores',
  context: {
    user: { role: 'isAdmin' },
    lessons: [
      {
        /* */
      },
      {
        /* */
      },
      {
        /* */
      },
    ],
  },
}); // doSomething flow will be executed

```

## Run Hooks

```typescript

const actions$ = new Subject<Action>(); // for exmple -> here should be actions$ from redux

const conditionFlowEngine = createConditionFlowEngine({
  flowRunner: createFlowRunner({
    actions$: actions$.asObservable(),
    dispatch: actions$.next,
  }),
  config: {
    flowsMap: {
      doSomething: [{ type: 'action1' }, { type: 'action2' }],
      doOtherStuff: [{ type: 'action2' }, { type: 'action3' }, { type: 'action3' }],
    },
    conditionsMap: {
      isAdmin: {
        operation: Operation.EQ,
        mapFromLocalContext: ['user', 'role'],
        value: 'admin',
      },
    },
    hooks: {
      // validate conditions one by one and run flow for first valid condition
      onLessonCreated: [
        {
          condition: 'isAdmin',
          flow: 'doSomething',
        },
        'doOtherStuff',
      ],
    },
  }
});

conditionFlowEngine.runHook('onLessonCreated', { user: { role: 'student' } }); // doOtherStuff flow will be executed

```

## Update config

```typescript

const actions$ = new Subject<Action>();

const conditionFlowEngine = createConditionFlowEngine({
  flowRunner: createFlowRunner({
    actions$: actions$.asObservable(),
    dispatch: actions$.next,
  }),
  config: {
    conditionsMap: {
      isAdmin: {
        operation: Operation.EQ,
        mapFromLocalContext: ['user', 'role'],
        value: 'admin'
      }
    },
  }
});

conditionFlowEngine.updateConfig((currentConfig) => ({
  ...currentConfig,
  isFirstLesson: {
    operation: Operation.EQ,
    mapFromLocalContext: ['lessons', 'length'],
    value: '1',
  },
}));

conditionFlowEngine.validateCondition({ condition: 'isFirstLesson', context: { lessons: [1] } }) // true

```

## Background Flows

```typescript

const actions$ = new Subject<Action>();

const conditionFlowEngine = createConditionFlowEngine({
  flowRunner: createFlowRunner({
    actions$: actions$.asObservable(),
    dispatch: actions$.next,
  }),
  config: {
    flowsMap: {
      doSomething: [{ type: 'action1' }, { type: 'action2' }],
      doOtherStuff: [{ type: 'action2' }, { type: 'action3' }, { type: 'action3' }],
    },
    conditionsMap: {
      isAdmin: {
        operation: Operation.EQ,
        mapFromLocalContext: ['user', 'role'],
        value: 'admin',
      },
      isFirstLesson: {
        operation: Operation.EQ,
        mapFromLocalContext: ['currentLesson'],
        value: '1',
      },
      isLessonsFinished: {
        operation: Operation.EQ,
        mapFromLocalContext: ['isLessonsFinished'],
        value: true,
      },
    },
    backgroundFlows: {
      showAlert: [
        {
          conditionToSubscribe: 'isFirstLesson',
          conditionToRunFlow: 'isLessonsFinished',
          flow: 'doSomething',
        },
      ],
    },
  }
});

const context$ = new BehaviorSubject<any>({ currentLesson: 1, isLessonsFinished: false });

conditionFlowEngine.runBackgroundFlows('showAlert', context$);

// delay 2000

context$.next({ currentLesson: null, isLessonsFinished: true }); // doSomething flow will be executed

// For unsubcribe logic

conditionFlowEngine.runBackgroundFlows('showAlert', context$); // unsubcribe from showAlert BackgroundFlows and try to subscribe againe

// OR

conditionFlowEngine.stopBackgrounFlows('showAlert'); // unsubcribe from showAlert BackgroundFlows

// OR 

conditionFlowEngine.stopAllBackgrounFlows(); // unsubcribe from all BackgroundFlows

```
