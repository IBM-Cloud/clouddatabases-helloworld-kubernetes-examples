# clouddatabases-postgresql-nodejs-on-kubernetes overview

clouddatabases-postgresql-helloworld-nodejs is a sample IBM Cloud application which shows you how to connect to an IBM Cloud Databases for PostgreSQL service to an IBM Cloud Kubernetes Service application written in Node.js.

## Running the app on IBM Cloud

1. If you do not already have an IBM Cloud account, [sign up here][IBMCloud_signup_url]

2. [Download and install IBM Cloud CLI][Download_IBMCloud_cli]

    The IBM Cloud CLI tool tool is what you'll use to communicate with IBM Cloud from your terminal or command line.

3. Install the IBM Cloud Kubernetes Service plugin.

      ```shell
      ibmcloud plugin install container-service -r Bluemix
      ```

      To verify that it's properly installed run:

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
      service instance name, a service name, plan name and location. For example, if we wished to create a database service named "example-psql" and we wanted it to be a "databases-for-postgresql" deployment on the standard plan running in the us-south region, the command would look like this:

      ```shell
      ibmcloud resource service-instance-create example-psql databases-for-postgresql standard us-south
      ```
      Remember the database service instance name.

7. [Create an IBM Cloud Kubernetes Service](https://cloud.ibm.com/containers-kubernetes/overview). Choose the location and resource group that you want to set up your cluster in. Select the cluster type that you want to use. This example only requires the lite plan which comes with 1 worker node.

      Once a cluster is provisioned, follow the steps to access your cluster and set the environment variables under the _Access_ tab. There, you will also be able to verify that your deployment is provisioned and running normally.

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

10. Add the IBM Cloud Databases for PostgreSQL service to your cluster.

      ```shell
      ibmcloud ks cluster-service-bind <your_cluster_name> default example-psql
      ```

11. Verify that the Kubernetes secret was create in your cluster namespace. Kubernetes uses secrets to store confidential information like the IBM Cloud Identity and Access Management (IAM) API key and the URL that the container uses to gain access. Running the following command, you'll get the APO key for accessing the instance of your Databases for PostgreSQL service that's provisioned in your account.

      ```shell
      kubectl get secrets --namespace=default
      ```

12. Clone the app to your local environment from your terminal using the following command:

      ```shell
      git clone git@github.com:aa7955/clouddatabases-postgresql-helloworld-nodejs.git
      ```




8. `cd` into this newly created directory. The code for connecting to the service, and reading from and updating the database can be found in `server.js`. See [Code Structure](#code-structure) and the code comments for information on the app's functions. There's also a `public` directory, which contains the html, style sheets and javascript for the web app. For now, the only file you need to update is the application manifest.

9. Update the `manifest.yml` file.

   - Change the `name` value. The value you choose will be the name of the app as it appears in your IBM Cloud dashboard.
   - Change the `route` value to something unique. This will make be the base URL of your application. It should end with `.mybluemix.net`. For example `example-helloworld-nodejs.mybluemix.net`.

   Update the `service` value in `manifest.yml` to match the name of your database service instance name.

10. Push the app to IBM Cloud. When you push the app it will automatically be bound to the service.

  ```shell
  ibmcloud cf push
  ```

Your application is now running at host you entered as the value for the `route` in `manifest.yml`.

The node-postgresql-helloworld app displays the contents of an _examples_ database. To demonstrate that the app is connected to your service, add some words to the database. The words are displayed as you add them, with the most recently added words displayed first.

## Code Structure

| File | Description |
| ---- | ----------- |
|[**server.js**](server.js)|Establishes a connection to the PostgreSQL database using credentials from VCAP_ENV and handles create and read operations on the database. |
|[**main.js**](public/javascripts/main.js)|Handles user input for a PUT command and parses the results of a GET command to output the contents of the PostgreSQL database.|

The app uses a PUT and a GET operation:

- PUT
  - takes user input from [main.js](public/javascript/main.js)
  - uses the `client.query` method to add the user input to the words table

- GET
  - uses `client.query` method to retrieve the contents of the _words_ table
  - returns the response of the database command to [main.js](public/javascript/main.js)



[databases_for_postgreSQL_url]: https://console.bluemix.net/catalog/services/databases-for-postgreSQL/
[IBMCloud_signup_url]: https://console.bluemix.net/registration/?cm_mmc=Display-SampleApp-_-IBMCloudSampleApp-DatabasesForPostgreSQL
[Download_IBMCloud_cli]: https://console.bluemix.net/docs/cli/reference/bluemix_cli/download_cli.html
[Download_Kubernetes_cli]: https://kubernetes.io/docs/tasks/tools/install-kubectl/
