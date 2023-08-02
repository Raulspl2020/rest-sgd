pipeline {

    agent any
    environment {
        PORT="3000"
        NODE_ENV="dev"
    }

    stages {
        stage("Build") {
            steps {
                echo "Building.. Construyendo"
            }
        }
        stage("Test") {
            steps {
                echo "Testing.. Testeando"
            }
        }
        stage("Deploy") {
            steps {
                echo "Deploying.... desplegando"
                sh "docker-compose down --remove-orphans"
                sh "docker-compose up -d --build"
            }
        }
    }
}
