pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = credentials('dockerhub-username')
        DOCKERHUB_PASSWORD = credentials('dockerhub-password')
        SONAR_TOKEN = credentials('sonarqube-auth')
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // stage('Docker Build & Push') {
        //     steps {
        //         script {
        //             sh '''
        //                 echo "${DOCKERHUB_PASSWORD}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
        //                 docker build -t duckzuybidan/nest-auth:latest .
        //                 docker push duckzuybidan/nest-auth:latest
        //             '''
        //         }
        //     }
        // }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        sonar-scanner \
                          -Dsonar.projectKey=nest-auth \
                          -Dsonar.sources=. \
                          -Dsonar.host.url=http://localhost:9000 \
                          -Dsonar.login=${SONAR_TOKEN}
                    '''
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }
}
