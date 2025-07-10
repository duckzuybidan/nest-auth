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

        // stage('SonarQube Analysis') {
        //     steps {
        //         withSonarQubeEnv('SonarQube') {
        //             sh '''
        //                 sonar-scanner \
        //                   -Dsonar.projectKey=nest-auth \
        //                   -Dsonar.sources=. \
        //                   -Dsonar.host.url=http://192.168.2.3:9000 \
        //                   -Dsonar.login=${SONAR_TOKEN}
        //             '''
        //         }
        //     }
        // }

        // stage('SonarQube Quality Gate') {
        //     steps {
        //         timeout(time: 5, unit: 'MINUTES') {
        //             waitForQualityGate abortPipeline: false
        //         }
        //     }
        // }

        stage('Docker Build') {
            steps {
                echo '🛠️ Building Docker image...'
                sh '''
                    docker build -t duckzuybidan/nest-auth:latest .
                '''
            }
        }

        stage('Security Scan') {
            steps {
                echo '🔎 Running Trivy vulnerability scan...'
                sh '''
                    trivy image --exit-code 1 --severity HIGH,CRITICAL duckzuybidan/nest-auth:latest
                '''
            }
        }

        // stage('Docker Push') {
        //     steps {
        //         echo '📦 Pushing image to Docker Hub...'
        //         sh '''
        //             echo "${DOCKERHUB_PASSWORD}" | docker login -u "${DOCKERHUB_USERNAME}" --password-stdin
        //             docker push duckzuybidan/nest-auth:latest
        //         '''
        //     }
        // }
    }
}
