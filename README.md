# ejflab-ai

## Add new application (only one time)

```
ng generate module views/ejflabmodule --route ejflabmodule --module app.module --skip-tests
```

## Add new view

```
ng generate component views/ejflabmodule/views/my-view --standalone false --skip-tests
```

## Add new component

```
ng generate component views/ejflabmodule/components/my-component --standalone false  --skip-tests
```

```
gcloud auth login
gcloud config set project ejfexperiments
gcloud auth configure-docker us-docker.pkg.dev