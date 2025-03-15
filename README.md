# ejflab-ai

## Add new application (only one time)

```
ng generate module views/ejflabmodule --route ejflabmodule --module app.module --skip-tests
ng generate module views/body --route body --module app.module
```

## Add new view

```
ng generate component views/ejflabmodule/views/my-view --standalone false --skip-tests
```

## Add new component

```
ng generate component views/ejflabmodule/components/ocr --standalone false  --skip-tests
```

```
gcloud auth login
gcloud config set project ejfexperiments
gcloud auth configure-docker us-docker.pkg.dev