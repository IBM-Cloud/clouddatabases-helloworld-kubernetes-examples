# clouddatabases-elasticsearch-nodejs-on-kubernetes overview

clouddatabases-elasticsearch-helloworld-nodejs is a sample IBM Cloud application which shows you how to connect to an IBM Cloud Databases for Elasticsearch service to an IBM Cloud Kubernetes Service application written in Node.js.

## Running the app on IBM Cloud

1. If you do not already have an IBM Cloud account, [sign up here][IBMCloud_signup_url]

2. [Download and install IBM Cloud CLI][Download_IBMCloud_cli]

    The IBM Cloud CLI tool tool is what you'll use to communicate with IBM Cloud from your terminal or command line.

3. Install the IBM Cloud Kubernetes Service plugin.

      ```shell
      ibmcloud plugin install container-service -r Bluemix
      ```

      To verify that it's properly installed, run:

      ```shell
      ibmcloud plugin list
      ```

4. [Download and install the Kubernetes CLI][Download_Kubernetes_cli]

      Follow the instructions for downloading and installing the Kubernetes CLI for the platform you're using.

5. Connect to IBM Cloud in the command line tool and follow the prompts to log in.

      ```shell
      ibmcloud login
      ```

      **Note:** If you have a federated user ID, use the `ibmcloud login --sso` command to log in with your single sign on ID.

6. Create your database service.

      The database can be created from the command line using the `ibmcloud resource service-instance-create` command. This takes a
      service instance name, a service name, plan name and location. For example, if we wished to create a database service named "example-elasticsearch" and we wanted it to be a "databases-for-elasticsearch" deployment on the standard plan running in the us-south region, the command would look like this:

      ```shell
      ibmcloud resource service-instance-create example-elasticsearch databases-for-elasticsearch standard us-south
      ```
      Remember the database service instance name.

      You can also set up the database to use [public and/or private service endpoints](https://cloud.ibm.com/docs/services/service-endpoint?topic=service-endpoint-about), otherwise a public endpoint will be created by default. To set up private endpoints, see our [documentation](https://cloud.ibm.com/docs/services/databases-for-elasticsearch?topic=cloud-databases-service-endpoints).


7. [Create an IBM Cloud Kubernetes Service](https://cloud.ibm.com/containers-kubernetes/overview).

      Choose the location and resource group that you want to set up your cluster in. Select the cluster type that you want to use. This example only requires the free plan which comes with 1 worker node. However, if you want to use private endpoints to connect to Kubernetes applications, you'll need to upgrade to the paid Kubernetes plan.

      Once a cluster is provisioned, you'll be given a list of steps to follow to access your cluster and set the environment variables under the _Access_ tab. There, you will also be able to verify that your deployment is provisioned and running normally.

8. Make sure you are targeting the correct IBM Cloud resource group of your IBM Cloud Kubernetes Service.

      Use the following command to target your cluster resource group if your resource group is other than `default`.

      ```shell
      ibmcloud target -g <resource_group_name>
      ```

      For this example, we're using the `default` resource group.

9. Create your own private image repository in IBM Cloud Container Registry to store your application's Docker image. Since we want the images to be private, we need to create a namespace, which will create a unique URL to your image repository.  

      ```shell
      ibmcloud cr namespace-add <your_namespace>
      ```

10. Add the IBM Cloud Databases for Elasticsearch service to your cluster.

      ```shell
      ibmcloud ks cluster-service-bind <your_cluster_name> default example-elasticsearch
      ```

      **Note**: If your database uses both public and private endpoints, your public endpoint will be used by default. Therefore, if you want to select the private endpoint, first you will need to create a [service key](https://cloud.ibm.com/docs/cli/reference/ibmcloud?topic=cloud-cli-ibmcloud_commands_resource#ibmcloud_resource_service_key_create) for your database so Kubernetes can use it when binding to the database. You can set up a service key, for example, that we'll call `example-private-key`  using the command:

      ```shell
      ibmcloud resource service-key-create example-private-key Administrator --instance-name example-elasticsearch --service-endpoint private  
      ```

      The role that we've selected for this key is `Administrator` with our database name `example-elasticsearch`, and we make sure that the private service endpoint is selected `--service-endpoint private`. After that, you'll bind the database to the Kubernetes cluster using the command:

      ```shell
      ibmcloud ks cluster-service-bind <your_cluster_name> default example-elasticsearch --key example-private-key
      ```

      This will create a secret in your Kubernetes cluster using the database's private endpoint from the key you've created above.

11. Verify that the Kubernetes secret was create in your cluster namespace. Kubernetes uses secrets to store confidential information like the IBM Cloud Identity and Access Management (IAM) API key and the URL that the container uses to gain access. Running the following command, you'll get the API key for accessing the instance of your Databases for Elasticsearch service that's provisioned in your account.

      ```shell
      kubectl get secrets --namespace=default
      ```

    **Note**: save the name of the secret that was generated when you bound `example-elasticsearch` to your Kubernetes service.

12. Clone the app to your local environment from your terminal using the following command:

      ```shell
      git clone -b node git@github.com:IBM-Cloud/clouddatabases-helloworld-kubernetes-examples.git
      ```

13. `cd` into this newly created directory, and `cd` into the `elasticsearch` folder. The code for connecting to the service, and reading from and updating the database can be found in `server.js`. See [Code Structure](#code-structure) and the code comments for information on the app's functions. There's also a `public` directory, which contains the html, style sheets and JavaScript for the web app. But, to get the application working, we'll first need to push the Docker image of this application to our IBM Cloud Container Registry.

14. Build and push the application's Docker image to your IBM Cloud Container Registry. We're calling this container `icdes`.

    ```shell
    ibmcloud cr build -t <region>.icr.io/<namespace>/icdes .
    ```

    After it's built, you can view the image in container registry using:

    ```shell
    ibmcloud cr images
    ```

    You'll get something like the following response:

    ```shell
    REPOSITORY                                TAG      DIGEST         NAMESPACE   CREATED       SIZE    SECURITY STATUS
    <region>.icr.io/mynamespace/icdes         latest   81c3959ea657   mynamespace 4 hours ago   28 MB   No Issues
    ```

15. Update the Kubernetes deployment configuration file `clouddb-deployment.yaml`.

    Under the following, change the `image` name with the repository name that you got from the previous step:

    ```yaml
    image: "<region>.icr.io/<namespace>/icdes" # Edit me
    ```

    Now, under `secretKeyRef`, change the name of `<elasticsearch-secret-name>` to match the name of the secret that was created when you bound IBM Cloud Databases for Elasticsearch to your Kubernetes cluster.

    ```yaml
    secretKeyRef:
      name: <elasticsearch-secret-name> # Edit me
    ```

    As for the `service` configuration at the bottom of the file, [`nodePort`][nodePort_information] indicates the port that the application can be accessed from. You have a range from 30000 - 32767 that you can use, but we've chosen 30081. As for the TCP port, it's set to 8080, which is the port that the Node.js application runs on in the container.

16. Deploy the application to IBM Cloud Kubernetes Service. When you deploy the application, it will automatically be bound to your Kubernetes cluster.

    ```shell
    kubectl apply -f clouddb-deployment.yaml
    ```

17. Get the IP for the application.

    ```shell
    ibmcloud ks workers <cluster_name>
    ```

    The result will be something like:

    ```shell
    ID                                                 Public IP        Private IP      Machine Type   State    Status   Zone    Version
    kube-hou02-pa1a59e9fd92f44af9b4147a27a31db5c4-w1   199.199.99.999   10.76.202.188   free           normal   Ready    hou02   1.10.11_1536
    ```

    Now you can access the application from the Public IP on port 30081.

The clouddatabases-elasticsearch-helloworld app displays the contents of an _examples_ database. To demonstrate that the app is connected to your service, add some words to the database. The words are displayed as you add them, with the most recently added words displayed first.

## Code Structure

| File | Description |
| ---- | ----------- |
|[**server.js**](server.js)|Establishes a connection to the Elasticsearch database using credentials from BINDING (the name we created in the Kubernetes deployment file to expose the Elasticsearch credentials) and handles create and read operations on the database. |
|[**main.js**](public/javascripts/main.js)|Handles user input for a PUT command and parses the results of a GET command to output the contents of the Elasticsearch database.|

The app uses a PUT and a GET operation:

- PUT
  - takes user input from [main.js](public/javascript/main.js)
  - uses the `client.index` method to add the user input to the `ibmclouddb` index

- GET
  - uses `client.search` method to retrieve the contents of the `ibmclouddb` index
  - returns the response of the database command to [main.js](public/javascript/main.js)


[databases_for_elasticsearch_url]: https://console.bluemix.net/catalog/services/databases-for-elasticsearch/
[IBMCloud_signup_url]: https://console.bluemix.net/registration/?cm_mmc=Display-SampleApp-_-IBMCloudSampleApp-DatabasesForElasticsearch
[Download_IBMCloud_cli]: https://console.bluemix.net/docs/cli/reference/bluemix_cli/download_cli.html
[Download_Kubernetes_cli]: https://kubernetes.io/docs/tasks/tools/install-kubectl/
[nodePort_information]: https://console.bluemix.net/docs/containers/cs_nodeport.html#nodeport