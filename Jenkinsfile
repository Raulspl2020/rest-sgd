pipeline {

    agent any
    environment {
        PORT="3000"
        NODE_ENV="dev"
    }

    stages {
        stage("Test") {
            steps {
                echo "Testing.. Testeando"
            }
        }
        stage("Build") {
            steps {
                echo "Building.. Construyendo"
                sh "docker-compose build"
            }
        }
        stage("Deploy") {
            steps {
                echo "Deploying.... desplegando"
                sh "docker-compose down"
                sh "docker-compose up -d"
            }
        }
    }
}
